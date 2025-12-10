require('dotenv').config();
const express = require('express');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');
const { auth, requiresAuth } = require('express-openid-connect');

const app = express();
const PORT = process.env.PORT || 4000;

const auth0Domain = process.env.AUTH0_DOMAIN;
const auth0ClientId = process.env.AUTH0_CLIENT_ID;
const auth0Secret = process.env.AUTH0_SECRET;
const auth0BaseUrl = process.env.AUTH0_BASE_URL || `http://localhost:${PORT}`;
const authEnabled = Boolean(auth0Domain && auth0ClientId && auth0Secret);

const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: auth0Secret,
  baseURL: auth0BaseUrl,
  clientID: auth0ClientId,
  issuerBaseURL: auth0Domain ? `https://${auth0Domain}` : undefined
};

if (authEnabled) {
  app.use(auth(authConfig));
} else {
  console.warn(
    'Auth0 configuration incomplete. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_SECRET to enable login.'
  );
}

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layout');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

app.use((req, res, next) => {
  res.locals.user = req.oidc?.user || null;
  res.locals.authEnabled = authEnabled;
  res.locals.authMissing = !authEnabled;
  next();
});

const authGuard = authEnabled
  ? requiresAuth()
  : (req, res, next) => {
      res.locals.authMissing = true;
      next();
    };

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

const TAKEADS_SEARCH_PATH = '/v1/product/monetize-api/v1/coupon/search';

async function fetchOffersFromTakeads() {
  const baseURL = process.env.TAKEADS_BASE_URL || 'https://api.takeads.com';
  const platformKey = process.env.TAKEADS_PLATFORM_KEY;

  if (!platformKey) {
    console.warn('TAKEADS_PLATFORM_KEY is not set. Falling back to mock offers.');
    return mockOffers;
  }

  try {
    const resp = await axios.get(`${baseURL}${TAKEADS_SEARCH_PATH}`, {
      headers: {
        'Platform-Key': platformKey,
        Accept: 'application/json'
      },
      params: {
        page: 1,
        pageSize: 24
      }
    });

    const items = resp.data?.items || resp.data?.data || resp.data || [];
    const offers = (Array.isArray(items) ? items : []).map((item, idx) => {
      const rateValue =
        item.cashback || item.commissionRate || item.rewardRate || item.rate;
      const rate = typeof rateValue === 'number' ? `${rateValue}%` : rateValue || '';

      return {
        id: item.id || item.couponId || idx,
        merchant: item.advertiserName || item.merchantName || item.brand || 'Merchant',
        title: item.title || item.name || 'Cashback offer',
        description: item.description || item.summary || '',
        url: item.trackingUrl || item.offerUrl || item.redirectUrl || '#',
        rate
      };
    });

    return offers.length ? offers : mockOffers;
  } catch (err) {
    console.error('Error calling Takeads API, using mock offers:', err.message);
    return mockOffers;
  }
}

app.get('/', authGuard, async (req, res) => {
  const offers = await fetchOffersFromTakeads();
  res.render('index', {
    offers,
    authEnabled,
    authMissing: !authEnabled
  });
});

app.get('/profile', authGuard, (req, res) => {
  res.render('profile', {
    user: req.oidc?.user || null,
    authEnabled,
    authMissing: !authEnabled
  });
});

app.listen(PORT, () => {
  console.log(`Coupons site listening on port ${PORT}`);
});
