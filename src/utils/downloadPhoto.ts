/**
 * Utility to download a photo/image reliably across browsers and mobile devices.
 * Supports data URLs, blob URLs, and remote URLs (with canvas fallback for CORS).
 */
export async function downloadPhoto(imageUrl: string, suggestedFilename: string = 'smaran-sathi-photo.jpg'): Promise<boolean> {
  if (!imageUrl) return false;

  try {
    const cleanFilename = suggestedFilename.endsWith('.jpg') || suggestedFilename.endsWith('.png') || suggestedFilename.endsWith('.jpeg')
      ? suggestedFilename
      : `${suggestedFilename}.jpg`;

    // 1. Data URLs & Blob URLs
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    // 2. Fetch as blob
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = cleanFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        return true;
      }
    } catch {
      // Proceed to canvas fallback
    }

    // 3. Canvas Fallback for CORS images
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 600;
          canvas.height = img.naturalHeight || 600;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = cleanFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 3000);
                resolve(true);
              } else {
                fallbackDirectDownload(imageUrl, cleanFilename);
                resolve(true);
              }
            }, 'image/jpeg', 0.95);
          } else {
            fallbackDirectDownload(imageUrl, cleanFilename);
            resolve(true);
          }
        } catch {
          fallbackDirectDownload(imageUrl, cleanFilename);
          resolve(true);
        }
      };

      img.onerror = () => {
        fallbackDirectDownload(imageUrl, cleanFilename);
        resolve(false);
      };

      img.src = imageUrl;
    });
  } catch (err) {
    console.error('Error downloading photo:', err);
    fallbackDirectDownload(imageUrl, suggestedFilename);
    return false;
  }
}

function fallbackDirectDownload(imageUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = imageUrl;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
