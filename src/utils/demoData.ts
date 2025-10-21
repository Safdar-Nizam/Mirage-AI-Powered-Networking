import { supabase } from '../lib/supabase';

const getRandomAvatar = (isFemale: boolean, seed: number): string => {
  const photoId = (seed % 30) + 1;
  return `https://randomuser.me/api/portraits/${isFemale ? 'women' : 'men'}/${photoId}.jpg`;
};

const locations = [
  { city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753, count: 15 },
  { city: 'Jeddah', country: 'Saudi Arabia', lat: 21.5433, lng: 39.1728, count: 10 },
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060, count: 10 },
  { city: 'Miami', country: 'USA', lat: 25.7617, lng: -80.1918, count: 10 },
  { city: 'Austin', country: 'USA', lat: 30.2672, lng: -97.7431, count: 5 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, count: 10 },
  { city: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, count: 10 },
];

const getLocationForIndex = (index: number) => {
  let accumulated = 0;
  for (const loc of locations) {
    accumulated += loc.count;
    if (index < accumulated) {
      return { city: loc.city, country: loc.country, latitude: loc.lat, longitude: loc.lng };
    }
  }
  return { city: locations[0].city, country: locations[0].country, latitude: locations[0].lat, longitude: locations[0].lng };
};

export async function createDemoData(userId: string) {
  const categories = [
    { name: 'Finance', color: '#008080' },
    { name: 'Marketing', color: '#FF7A00' },
    { name: 'Arts & History', color: '#98A2B3' },
    { name: 'Technology', color: '#4F46E5' },
    { name: 'Healthcare', color: '#10B981' },
  ];

  const { data: insertedCategories, error: catError } = await supabase
    .from('categories')
    .insert(categories.map(cat => ({ ...cat, user_id: userId })))
    .select();

  if (catError || !insertedCategories) {
    console.error('Error creating categories:', catError);
    return;
  }

  const categoryMap = {
    finance: insertedCategories[0].id,
    marketing: insertedCategories[1].id,
    arts: insertedCategories[2].id,
    tech: insertedCategories[3].id,
    healthcare: insertedCategories[4].id,
  };

  const layer1Contacts = [
    { name: 'Sarah Johnson', profession: 'Investment Banker', category: categoryMap.finance, layer: 1, isFemale: true },
    { name: 'Michael Chen', profession: 'Marketing Director', category: categoryMap.marketing, layer: 1, isFemale: false },
    { name: 'Emma Williams', profession: 'Art Curator', category: categoryMap.arts, layer: 1, isFemale: true },
    { name: 'David Kumar', profession: 'Software Engineer', category: categoryMap.tech, layer: 1, isFemale: false },
    { name: 'Lisa Anderson', profession: 'Surgeon', category: categoryMap.healthcare, layer: 1, isFemale: true },
    { name: 'Rachel Foster', profession: 'Venture Capitalist', category: categoryMap.finance, layer: 1, isFemale: true },
    { name: 'Thomas Reed', profession: 'Creative Director', category: categoryMap.marketing, layer: 1, isFemale: false },
    { name: 'Victoria Hayes', profession: 'Historian', category: categoryMap.arts, layer: 1, isFemale: true },
    { name: 'Marcus Webb', profession: 'CTO', category: categoryMap.tech, layer: 1, isFemale: false },
    { name: 'Diana Cross', profession: 'Medical Director', category: categoryMap.healthcare, layer: 1, isFemale: true },
  ];

  const { data: layer1Data, error: l1Error } = await supabase
    .from('contacts')
    .insert(
      layer1Contacts.map((contact, idx) => {
        const location = getLocationForIndex(idx);
        return {
          user_id: userId,
          name: contact.name,
          profession: contact.profession,
          category_id: contact.category,
          layer: contact.layer,
          photo_url: getRandomAvatar(contact.isFemale, idx + 1),
          warmth_status: 'warm',
          consent_status: 'accepted',
          ai_enabled: true,
          last_contacted: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          city: location.city,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
        };
      })
    )
    .select();

  if (l1Error || !layer1Data) {
    console.error('Error creating layer 1 contacts:', l1Error);
    return;
  }

  const layer2Contacts = [
    { name: 'James Rodriguez', profession: 'Financial Analyst', parentIdx: 0, category: categoryMap.finance, layer: 2, isFemale: false },
    { name: 'Olivia Martinez', profession: 'Portfolio Manager', parentIdx: 0, category: categoryMap.finance, layer: 2, isFemale: true },
    { name: 'Robert Taylor', profession: 'Brand Strategist', parentIdx: 1, category: categoryMap.marketing, layer: 2, isFemale: false },
    { name: 'Sophia Lee', profession: 'Content Manager', parentIdx: 1, category: categoryMap.marketing, layer: 2, isFemale: true },
    { name: 'William Brown', profession: 'Museum Director', parentIdx: 2, category: categoryMap.arts, layer: 2, isFemale: false },
    { name: 'Isabella Garcia', profession: 'Gallery Owner', parentIdx: 2, category: categoryMap.arts, layer: 2, isFemale: true },
    { name: 'Daniel Kim', profession: 'Tech Lead', parentIdx: 3, category: categoryMap.tech, layer: 2, isFemale: false },
    { name: 'Ava Patel', profession: 'Product Manager', parentIdx: 3, category: categoryMap.tech, layer: 2, isFemale: true },
    { name: 'Nathan Pierce', profession: 'Hedge Fund Manager', parentIdx: 4, category: categoryMap.healthcare, layer: 2, isFemale: false },
    { name: 'Grace Sullivan', profession: 'Investment Advisor', parentIdx: 5, category: categoryMap.finance, layer: 2, isFemale: true },
    { name: 'Oliver Brooks', profession: 'Digital Marketer', parentIdx: 6, category: categoryMap.marketing, layer: 2, isFemale: false },
    { name: 'Maya Singh', profession: 'PR Specialist', parentIdx: 6, category: categoryMap.marketing, layer: 2, isFemale: true },
    { name: 'Ethan Stone', profession: 'Art Dealer', parentIdx: 7, category: categoryMap.arts, layer: 2, isFemale: false },
    { name: 'Claire Mitchell', profession: 'Archivist', parentIdx: 7, category: categoryMap.arts, layer: 2, isFemale: true },
    { name: 'Ryan Zhou', profession: 'DevOps Engineer', parentIdx: 8, category: categoryMap.tech, layer: 2, isFemale: false },
    { name: 'Jessica Yuan', profession: 'Data Scientist', parentIdx: 8, category: categoryMap.tech, layer: 2, isFemale: true },
    { name: 'Samuel Hunt', profession: 'Cardiologist', parentIdx: 9, category: categoryMap.healthcare, layer: 2, isFemale: false },
    { name: 'Anna Coleman', profession: 'Pharmacist', parentIdx: 9, category: categoryMap.healthcare, layer: 2, isFemale: true },
  ];

  const { data: layer2Data, error: l2Error } = await supabase
    .from('contacts')
    .insert(
      layer2Contacts.map((contact, idx) => {
        const location = getLocationForIndex(idx + 10);
        return {
          user_id: userId,
          name: contact.name,
          profession: contact.profession,
          category_id: contact.category,
          layer: contact.layer,
          photo_url: getRandomAvatar(contact.isFemale, idx + 11),
          parent_contact_id: layer1Data[contact.parentIdx].id,
          warmth_status: Math.random() > 0.5 ? 'warm' : 'cooling',
          consent_status: Math.random() > 0.3 ? 'accepted' : 'pending',
          ai_enabled: Math.random() > 0.5,
          last_contacted: Math.random() > 0.4
            ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
            : null,
          city: location.city,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
        };
      })
    )
    .select();

  if (l2Error || !layer2Data) {
    console.error('Error creating layer 2 contacts:', l2Error);
    return;
  }

  const layer3Contacts = [
    { name: 'Ethan White', profession: 'Junior Analyst', parentIdx: 0, category: categoryMap.finance, layer: 3, isFemale: false },
    { name: 'Mia Thompson', profession: 'Research Associate', parentIdx: 0, category: categoryMap.finance, layer: 3, isFemale: true },
    { name: 'Noah Jackson', profession: 'Investment Associate', parentIdx: 0, category: categoryMap.finance, layer: 3, isFemale: false },
    { name: 'Charlotte Davis', profession: 'Compliance Officer', parentIdx: 1, category: categoryMap.finance, layer: 3, isFemale: true },
    { name: 'Liam Wilson', profession: 'Asset Manager', parentIdx: 1, category: categoryMap.finance, layer: 3, isFemale: false },
    { name: 'Amelia Moore', profession: 'Wealth Advisor', parentIdx: 1, category: categoryMap.finance, layer: 3, isFemale: true },
    { name: 'Benjamin Clark', profession: 'Social Media Manager', parentIdx: 2, category: categoryMap.marketing, layer: 3, isFemale: false },
    { name: 'Harper Lewis', profession: 'SEO Specialist', parentIdx: 2, category: categoryMap.marketing, layer: 3, isFemale: true },
    { name: 'Lucas Gray', profession: 'Growth Marketer', parentIdx: 2, category: categoryMap.marketing, layer: 3, isFemale: false },
    { name: 'Ella Palmer', profession: 'Brand Manager', parentIdx: 3, category: categoryMap.marketing, layer: 3, isFemale: true },
    { name: 'Jack Morrison', profession: 'Copywriter', parentIdx: 3, category: categoryMap.marketing, layer: 3, isFemale: false },
    { name: 'Lily Chen', profession: 'Media Buyer', parentIdx: 3, category: categoryMap.marketing, layer: 3, isFemale: true },
    { name: 'Henry Blake', profession: 'Influencer Manager', parentIdx: 3, category: categoryMap.marketing, layer: 3, isFemale: false },
    { name: 'Zoe Russell', profession: 'Art Conservator', parentIdx: 4, category: categoryMap.arts, layer: 3, isFemale: true },
    { name: 'Logan Fisher', profession: 'Museum Guide', parentIdx: 4, category: categoryMap.arts, layer: 3, isFemale: false },
    { name: 'Aria Cooper', profession: 'Exhibition Coordinator', parentIdx: 5, category: categoryMap.arts, layer: 3, isFemale: true },
    { name: 'Mason Knight', profession: 'Gallery Manager', parentIdx: 5, category: categoryMap.arts, layer: 3, isFemale: false },
    { name: 'Scarlett Bell', profession: 'Art Handler', parentIdx: 5, category: categoryMap.arts, layer: 3, isFemale: true },
    { name: 'Jackson Price', profession: 'Backend Developer', parentIdx: 6, category: categoryMap.tech, layer: 3, isFemale: false },
    { name: 'Avery Stone', profession: 'Systems Architect', parentIdx: 6, category: categoryMap.tech, layer: 3, isFemale: true },
    { name: 'Wyatt Barnes', profession: 'Cloud Engineer', parentIdx: 6, category: categoryMap.tech, layer: 3, isFemale: false },
    { name: 'Madison Ford', profession: 'UX Designer', parentIdx: 7, category: categoryMap.tech, layer: 3, isFemale: true },
    { name: 'Caleb Wright', profession: 'Mobile Developer', parentIdx: 7, category: categoryMap.tech, layer: 3, isFemale: false },
    { name: 'Penelope Blake', profession: 'QA Engineer', parentIdx: 7, category: categoryMap.tech, layer: 3, isFemale: true },
    { name: 'Grayson Mills', profession: 'DevOps Specialist', parentIdx: 7, category: categoryMap.tech, layer: 3, isFemale: false },
    { name: 'Luna Hayes', profession: 'Investment Analyst', parentIdx: 8, category: categoryMap.finance, layer: 3, isFemale: true },
    { name: 'Xavier Ross', profession: 'Trader', parentIdx: 8, category: categoryMap.finance, layer: 3, isFemale: false },
    { name: 'Aurora Bell', profession: 'Financial Advisor', parentIdx: 9, category: categoryMap.finance, layer: 3, isFemale: true },
    { name: 'Julian Webb', profession: 'Portfolio Analyst', parentIdx: 9, category: categoryMap.finance, layer: 3, isFemale: false },
    { name: 'Stella Fox', profession: 'Content Strategist', parentIdx: 10, category: categoryMap.marketing, layer: 3, isFemale: true },
    { name: 'Miles Grant', profession: 'Ad Manager', parentIdx: 10, category: categoryMap.marketing, layer: 3, isFemale: false },
    { name: 'Violet Lane', profession: 'Email Marketer', parentIdx: 10, category: categoryMap.marketing, layer: 3, isFemale: true },
    { name: 'Asher Cole', profession: 'Campaign Manager', parentIdx: 11, category: categoryMap.marketing, layer: 3, isFemale: false },
    { name: 'Hazel Ward', profession: 'Communications Lead', parentIdx: 11, category: categoryMap.marketing, layer: 3, isFemale: true },
    { name: 'Maverick Hunt', profession: 'Curator Assistant', parentIdx: 12, category: categoryMap.arts, layer: 3, isFemale: false },
    { name: 'Nova Scott', profession: 'Art Restorer', parentIdx: 12, category: categoryMap.arts, layer: 3, isFemale: true },
    { name: 'Hudson King', profession: 'Art Appraiser', parentIdx: 12, category: categoryMap.arts, layer: 3, isFemale: false },
    { name: 'Willow Price', profession: 'Collections Manager', parentIdx: 13, category: categoryMap.arts, layer: 3, isFemale: true },
    { name: 'Ezra Murphy', profession: 'Restoration Specialist', parentIdx: 13, category: categoryMap.arts, layer: 3, isFemale: false },
    { name: 'Ivy Sanders', profession: 'Frontend Developer', parentIdx: 14, category: categoryMap.tech, layer: 3, isFemale: true },
    { name: 'Colton Reed', profession: 'Software Engineer', parentIdx: 14, category: categoryMap.tech, layer: 3, isFemale: false },
    { name: 'Cora Bennett', profession: 'Integration Engineer', parentIdx: 14, category: categoryMap.tech, layer: 3, isFemale: true },
    { name: 'Easton Foster', profession: 'Test Engineer', parentIdx: 15, category: categoryMap.tech, layer: 3, isFemale: false },
    { name: 'Ruby James', profession: 'Automation Engineer', parentIdx: 15, category: categoryMap.tech, layer: 3, isFemale: true },
    { name: 'Silas Morgan', profession: 'Medical Resident', parentIdx: 16, category: categoryMap.healthcare, layer: 3, isFemale: false },
    { name: 'Paisley Wright', profession: 'Physician Assistant', parentIdx: 16, category: categoryMap.healthcare, layer: 3, isFemale: true },
    { name: 'Gavin Cooper', profession: 'Surgical Resident', parentIdx: 16, category: categoryMap.healthcare, layer: 3, isFemale: false },
    { name: 'Eleanor Reed', profession: 'Nurse Practitioner', parentIdx: 17, category: categoryMap.healthcare, layer: 3, isFemale: true },
    { name: 'Declan Hughes', profession: 'Clinical Pharmacist', parentIdx: 17, category: categoryMap.healthcare, layer: 3, isFemale: false },
    { name: 'Piper Walsh', profession: 'Healthcare Coordinator', parentIdx: 17, category: categoryMap.healthcare, layer: 3, isFemale: true },
  ];

  await supabase.from('contacts').insert(
    layer3Contacts.map((contact, idx) => {
      const location = getLocationForIndex(idx + 30);
      return {
        user_id: userId,
        name: contact.name,
        profession: contact.profession,
        category_id: contact.category,
        layer: contact.layer,
        photo_url: getRandomAvatar(contact.isFemale, idx + 21),
        parent_contact_id: layer2Data[contact.parentIdx].id,
        warmth_status: Math.random() > 0.3 ? 'cooling' : 'cold',
        consent_status: Math.random() > 0.5 ? 'accepted' : 'pending',
        ai_enabled: Math.random() > 0.7,
        last_contacted: Math.random() > 0.6
          ? new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
      };
    })
  );

  const sampleMessages = [
    { contactId: layer1Data[0].id, content: 'Hey Sarah, hope you\'re doing well! Would love to catch up over coffee soon.', sent: true },
    { contactId: layer1Data[1].id, content: 'Michael, just saw your latest campaign - brilliant work! Let\'s chat about collaboration opportunities.', sent: true },
    { contactId: layer1Data[2].id, content: 'Emma, I heard about the new exhibition. Congratulations! Can\'t wait to visit.', sent: true },
  ];

  await supabase.from('messages').insert(
    sampleMessages.map(msg => ({
      user_id: userId,
      contact_id: msg.contactId,
      content: msg.content,
      is_ai_generated: false,
      status: msg.sent ? 'sent' : 'draft',
      sent_at: msg.sent ? new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : null,
    }))
  );

  console.log('Demo data created successfully');
}

export async function hasDemoData(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  return !error && (data?.length || 0) > 0;
}
