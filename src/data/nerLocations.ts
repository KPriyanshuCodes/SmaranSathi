export interface NERState {
  code: string;
  name: string;
  native_name?: string;
  major_cities: string[];
}

export const NER_STATES_DATA: NERState[] = [
  {
    code: 'AS',
    name: 'Assam',
    native_name: 'অসম',
    major_cities: [
      'Guwahati (Kamrup Metro)',
      'Silchar (Cachar)',
      'Dibrugarh',
      'Jorhat',
      'Tezpur (Sonitpur)',
      'Nagaon',
      'Tinsukia',
      'Bongaigaon',
      'Karimganj',
      'Sivasagar',
      'Diphu (Karbi Anglong)',
      'North Lakhimpur',
      'Dhubri',
      'Goalpara',
      'Barpeta',
      'Haflong (Dima Hasao)',
      'Hailakandi',
      'Kokrajhar',
      'Golaghat',
      'Dhemaji',
      'Morigaon',
      'Nalbari',
      'Biswanath',
      'Majuli Island'
    ]
  },
  {
    code: 'ML',
    name: 'Meghalaya',
    native_name: 'Meghalaya (Ka Ri Khasi)',
    major_cities: [
      'Shillong (East Khasi Hills)',
      'Tura (West Garo Hills)',
      'Jowai (West Jaintia Hills)',
      'Nongpoh (Ri-Bhoi)',
      'Cherrapunji / Sohra',
      'Williamnagar (East Garo Hills)',
      'Baghmara (South Garo Hills)',
      'Resubelpara (North Garo Hills)',
      'Mairang (Eastern West Khasi Hills)',
      'Khliehriat (East Jaintia Hills)',
      'Nongstoin (West Khasi Hills)',
      'Ampati (South West Garo Hills)'
    ]
  },
  {
    code: 'MN',
    name: 'Manipur',
    native_name: 'মণিপুৰ (Kangleipak)',
    major_cities: [
      'Imphal (Imphal West / East)',
      'Churachandpur (Lamka)',
      'Thoubal',
      'Bishnupur (Loktak Lake)',
      'Kakching',
      'Ukhrul',
      'Senapati',
      'Tamenglong',
      'Chandel',
      'Jiribam',
      'Kangpokpi'
    ]
  },
  {
    code: 'MZ',
    name: 'Mizoram',
    native_name: 'Mizoram (Zoram)',
    major_cities: [
      'Aizawl',
      'Lunglei',
      'Champhai',
      'Serchhip',
      'Kolasib',
      'Lawngtlai',
      'Saitual',
      'Mamit',
      'Khawzawl',
      'Hnahthial',
      'Siaha'
    ]
  },
  {
    code: 'NL',
    name: 'Nagaland',
    native_name: 'Nagaland',
    major_cities: [
      'Kohima',
      'Dimapur',
      'Chumoukedima',
      'Mokokchung',
      'Tuensang',
      'Wokha',
      'Zunheboto',
      'Mon',
      'Phek',
      'Kiphire',
      'Longleng',
      'Peren'
    ]
  },
  {
    code: 'TR',
    name: 'Tripura',
    native_name: 'ত্রিপুরা',
    major_cities: [
      'Agartala (West Tripura)',
      'Udaipur (Gomati)',
      'Dharmanagar (North Tripura)',
      'Kailashahar (Unakoti)',
      'Ambassa (Dhalai)',
      'Khowai',
      'Belonia (South Tripura)',
      'Teliamura',
      'Bishalgarh (Sepahijala)',
      'Melaghar'
    ]
  },
  {
    code: 'AR',
    name: 'Arunachal Pradesh',
    native_name: 'Arunachal Pradesh',
    major_cities: [
      'Itanagar (Papum Pare)',
      'Naharlagun',
      'Pasighat (East Siang)',
      'Tawang',
      'Ziro (Lower Subansiri)',
      'Tezu (Lohit)',
      'Roing (Lower Dibang Valley)',
      'Bomdila (West Kameng)',
      'Aalo (West Siang)',
      'Namsai',
      'Changlang',
      'Khonsa (Tirap)'
    ]
  },
  {
    code: 'SK',
    name: 'Sikkim',
    native_name: 'Sikkim',
    major_cities: [
      'Gangtok (East Sikkim)',
      'Namchi (South Sikkim)',
      'Geyzing / Gyalshing (West Sikkim)',
      'Mangan (North Sikkim)',
      'Ravangla',
      'Pakyong',
      'Soreng',
      'Singtam',
      'Rangpo'
    ]
  }
];

export const ALL_NER_LOCATIONS: string[] = NER_STATES_DATA.flatMap(state =>
  state.major_cities.map(city => `${city}, ${state.name}`)
);

export const DEFAULT_NER_LOCATION = 'Guwahati (Kamrup Metro), Assam';
