require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

/**
 * MOCK DATA for initial development
 * Replace with real Takeads API call in fetchOffersFromTakeads()
 */
const mockOffers = [
  {
    id: 1,
    merchant: 'Example Store',
    title: '5% cashback on all purchases',
    description: 'Shop now and get 5% cashback on all products.',
    url: '#',
    rate: '5%'
  },
  {
    id: 2,
    merchant: 'TechWorld',
    title: '8% cashback on electronics',
    description: 'Laptops, phones, and more with 8% cashback.',
    url: '#',
    rate: '8%'
  },
  {
    id: 3,
    merchant: 'TravelBuddy',
    title: '3% cashback on hotel bookings',
    description: 'Book your next trip and earn cashback.',
    url: '#',
    rate: '3%'
  }
];

/**
 * TODO: Plug in Takeads API here
 *
 * When you’re ready, replace the mock implementation with a live call
 * to Takeads’ coupon/merchant endpoint. Example sketch:
 *
 *   const baseURL = process.env.TAKEADS_BASE_URL;
 *   const platformKey = process.env.TAKEADS_PLATFORM_KEY;
 *
 *   const resp = await axios.get(
 *     baseURL + '/v1/product/monetize-api/v1/coupon/search',
 *     {
 *       headers: {
 *         // Check Takeads docs for the exact header name:
 *         // e.g. 'Platform-Key': platformKey
 *       },
 *       params: {
 *         page: 1,
 *         pageSize: 20
 *         // add filters as needed
 *       }
 *     }
 *   );
 *
 *   Then map resp.data into the structure used by the template.
 *
 * See: https://developers.takeads.com and their Postman collection :contentReference[oaicite:2]{index=2}
 */
async function fetchOffersFromTakeads() {
  // For now, just return mock data so the site works out of the box.
  return mockOffers;

  // Once you are ready, comment the line above and uncomment / adapt the following:

  /*
  const baseURL = process.env.TAKEADS_BASE_URL || 'https://api.takeads.com';
  const platformKey = process.env.TAKEADS_PLATFORM_KEY;

  if (!platformKey) {
    console.warn('TAKEADS_PLATFORM_KEY is not set. Falling back to mock offers.');
    return mockOffers;
  }

  try {
    const resp = await axios.get(
      baseURL + '/v1/product/monetize-api/v1/coupon/search',
      {
        headers: {
          // Replace with the header name Takeads expects:
          // e.g. 'Platform-Key': platformKey
        },
        params: {
          page: 1,
          pageSize: 20
        }
      }
    );

    // Adapt this mapping to match real response format
    const offers = (resp.data.items || []).map((item, idx) => ({
      id: idx,
      merchant: item.advertiserName || 'Merchant',
      title: item.title || 'Cashback offer',
      description: item.description || '',
      url: item.trackingUrl || '#',
      rate: item.commissionRate || ''
    }));

    return offers.length ? offers : mockOffers;
  } catch (err) {
    console.error('Error calling Takeads API, using mock offers:', err.message);
    return mockOffers;
  }
  */
}

app.get('/', async (req, res) => {
  const offers = await fetchOffersFromTakeads();
  res.render('index', { offers });
});

app.listen(PORT, () => {
  console.log(`Coupons site listening on port ${PORT}`);
});
