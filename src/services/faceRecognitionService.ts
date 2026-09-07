import * as faceapi from '@vladmandic/face-api';

export interface FaceDetectionResult {
  status: 'idle' | 'loading_models' | 'detecting' | 'face_found' | 'multiple_faces' | 'no_face' | 'poor_lighting' | 'error';
  message: string;
  descriptor?: number[];
  faceCount: number;
  lightingStatus: 'good' | 'too_dark' | 'too_bright';
  brightnessScore: number;
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FaceMatchCandidate {
  userId: string;
  name: string;
  role: 'elderly' | 'caregiver';
  distance: number;
  similarityPercentage: number;
}

let modelsLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;

/**
 * Checks average pixel luminance on an offscreen sample of the video frame.
 * Standard ITU-R BT.601 luminance: 0.299*R + 0.587*G + 0.114*B
 */
export function evaluateLighting(video: HTMLVideoElement): {
  status: 'good' | 'too_dark' | 'too_bright';
  brightness: number;
} {
  try {
    if (!video.videoWidth || !video.videoHeight) {
      return { status: 'good', brightness: 128 };
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { status: 'good', brightness: 128 };

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let totalLuma = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalLuma += 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const avg = totalLuma / count;
    if (avg < 45) {
      return { status: 'too_dark', brightness: avg };
    }
    if (avg > 225) {
      return { status: 'too_bright', brightness: avg };
    }
    return { status: 'good', brightness: avg };
  } catch (e) {
    return { status: 'good', brightness: 128 };
  }
}

/**
 * Loads face-api models from /models/ directory in public assets.
 */
export async function loadFaceModels(modelUri = '/models'): Promise<void> {
  if (modelsLoaded) return;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      // First try to load SSD MobileNet V1, 68 landmarks, and face recognition
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(modelUri),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUri),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelUri),
      ]);
      modelsLoaded = true;
    } catch (err) {
      console.warn('Primary SSD MobileNet load failed, falling back to Tiny Face Detector:', err);
      // Fallback to tiny face detector
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUri),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelUri),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelUri),
        ]);
        modelsLoaded = true;
      } catch (fallbackErr) {
        console.error('Failed to load face-api models:', fallbackErr);
        throw fallbackErr;
      }
    }
  })();

  return modelLoadingPromise;
}

/**
 * Scans a video frame and produces a 128-dimensional numerical face embedding descriptor.
 * Handles edge cases: no face, multiple faces, poor lighting.
 */
export async function scanFaceFromVideo(video: HTMLVideoElement): Promise<FaceDetectionResult> {
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  // 1. Check environmental lighting
  const lighting = evaluateLighting(video);
  if (lighting.status === 'too_dark') {
    return {
      status: 'poor_lighting',
      message: 'Lighting is too dark. Please face a light source or turn on a room light.',
      faceCount: 0,
      lightingStatus: 'too_dark',
      brightnessScore: lighting.brightness,
    };
  }
  if (lighting.status === 'too_bright') {
    return {
      status: 'poor_lighting',
      message: 'Lighting is too bright or has harsh glare. Please adjust camera angle.',
      faceCount: 0,
      lightingStatus: 'too_bright',
      brightnessScore: lighting.brightness,
    };
  }

  // 2. Detect all faces in current frame
  let detections: any[] = [];
  try {
    if (faceapi.nets.ssdMobilenetv1.isLoaded) {
      detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
    } else {
      detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptors();
    }
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'Error processing camera frames',
      faceCount: 0,
      lightingStatus: lighting.status,
      brightnessScore: lighting.brightness,
    };
  }

  // 3. Handle zero faces detected
  if (!detections || detections.length === 0) {
    return {
      status: 'no_face',
      message: 'No face detected. Center your face within the camera circle.',
      faceCount: 0,
      lightingStatus: lighting.status,
      brightnessScore: lighting.brightness,
    };
  }

  // 4. Handle multiple faces detected
  if (detections.length > 1) {
    return {
      status: 'multiple_faces',
      message: `Multiple faces (${detections.length}) detected. Ensure only you are in the camera frame.`,
      faceCount: detections.length,
      lightingStatus: lighting.status,
      brightnessScore: lighting.brightness,
    };
  }

  // 5. Exactly one face detected
  const single = detections[0];
  const descriptorArray = Array.from(single.descriptor as Float32Array);
  const box = single.detection.box;

  return {
    status: 'face_found',
    message: 'Face detected successfully!',
    descriptor: descriptorArray,
    faceCount: 1,
    lightingStatus: lighting.status,
    brightnessScore: lighting.brightness,
    box: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    },
  };
}

/**
 * Calculates Euclidean distance between two 128-dimensional face embedding vectors.
 * Lower distance = closer match.
 * Standard threshold for face-api is <= 0.6
 */
export function calculateEuclideanDistance(
  descriptor1: number[] | Float32Array,
  descriptor2: number[] | Float32Array
): number {
  if (descriptor1.length !== descriptor2.length) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Converts Euclidean distance to a human-readable similarity percentage (0 - 100%).
 * At distance 0.0 => 100%
 * At distance 0.3 => 85%
 * At distance 0.6 (standard threshold) => 65%
 * At distance 1.0+ => 0%
 */
export function distanceToSimilarity(distance: number): number {
  if (distance <= 0) return 100;
  if (distance >= 1.2) return 0;
  // Non-linear mapping where 0.6 gives ~65% match
  const score = Math.max(0, 100 - (distance / 0.9) * 100);
  return Math.round(score);
}

/**
 * Compares an input face descriptor against a collection of registered users.
 * Returns the best match if within threshold (default 0.6).
 */
export function findBestFaceMatch(
  liveDescriptor: number[],
  registeredUsers: Array<{
    id: string;
    name: string;
    role: 'elderly' | 'caregiver';
    face_descriptor?: number[];
  }>,
  distanceThreshold = 0.6
): {
  matchFound: boolean;
  bestMatch: FaceMatchCandidate | null;
  allMatches: FaceMatchCandidate[];
  distance: number;
} {
  const allMatches: FaceMatchCandidate[] = [];

  for (const user of registeredUsers) {
    if (!user.face_descriptor || !Array.isArray(user.face_descriptor) || user.face_descriptor.length === 0) {
      continue;
    }

    const dist = calculateEuclideanDistance(liveDescriptor, user.face_descriptor);
    allMatches.push({
      userId: user.id,
      name: user.name,
      role: user.role,
      distance: dist,
      similarityPercentage: distanceToSimilarity(dist),
    });
  }

  allMatches.sort((a, b) => a.distance - b.distance);

  if (allMatches.length > 0 && allMatches[0].distance <= distanceThreshold) {
    return {
      matchFound: true,
      bestMatch: allMatches[0],
      allMatches,
      distance: allMatches[0].distance,
    };
  }

  return {
    matchFound: false,
    bestMatch: allMatches[0] || null,
    allMatches,
    distance: allMatches[0]?.distance ?? Infinity,
  };
}
