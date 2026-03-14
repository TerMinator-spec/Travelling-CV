const { db } = require('../db/schema');

function calculateCompatibility(userId1, userId2) {
  const cv1 = db.prepare('SELECT * FROM travelling_cv WHERE user_id = ?').get(userId1);
  const cv2 = db.prepare('SELECT * FROM travelling_cv WHERE user_id = ?').get(userId2);

  if (!cv1 || !cv2) return { score: 0, breakdown: {}, matches: {} };

  const history1 = db.prepare('SELECT DISTINCT country FROM travel_history WHERE user_id = ?').all(userId1).map(r => r.country);
  const history2 = db.prepare('SELECT DISTINCT country FROM travel_history WHERE user_id = ?').all(userId2).map(r => r.country);

  // 1. Common destinations visited (20% weight)
  const commonVisited = history1.filter(c => history2.includes(c));
  const visitedScore = history1.length > 0 && history2.length > 0
    ? (commonVisited.length / Math.max(history1.length, history2.length)) * 100
    : 0;

  // 2. Travel style match (20% weight)
  const styles1 = parseList(cv1.travel_style);
  const styles2 = parseList(cv2.travel_style);
  const commonStyles = styles1.filter(s => styles2.includes(s));
  const styleScore = styles1.length > 0 && styles2.length > 0
    ? (commonStyles.length / Math.max(styles1.length, styles2.length)) * 100
    : 0;

  // 3. Future destination overlap (25% weight)
  const wishlist1 = parseList(cv1.wishlist_destinations);
  const wishlist2 = parseList(cv2.wishlist_destinations);
  const commonWishlist = wishlist1.filter(d => wishlist2.includes(d));
  const wishlistScore = wishlist1.length > 0 && wishlist2.length > 0
    ? (commonWishlist.length / Math.max(wishlist1.length, wishlist2.length)) * 100
    : 0;

  // 4. Budget preference similarity (10% weight)
  const budgetMap = { 'budget': 1, 'moderate': 2, 'comfort': 3, 'luxury': 4 };
  const b1 = budgetMap[cv1.budget_preference] || 2;
  const b2 = budgetMap[cv2.budget_preference] || 2;
  const budgetScore = Math.max(0, 100 - Math.abs(b1 - b2) * 33);

  // 5. Travel months overlap (10% weight)
  const months1 = parseList(cv1.preferred_months);
  const months2 = parseList(cv2.preferred_months);
  const commonMonths = months1.filter(m => months2.includes(m));
  const monthsScore = months1.length > 0 && months2.length > 0
    ? (commonMonths.length / Math.max(months1.length, months2.length)) * 100
    : 50; // neutral if unset

  // 6. Shared interests (15% weight)
  const interests1 = parseList(cv1.interests);
  const interests2 = parseList(cv2.interests);
  const commonInterests = interests1.filter(i => interests2.includes(i));
  const interestsScore = interests1.length > 0 && interests2.length > 0
    ? (commonInterests.length / Math.max(interests1.length, interests2.length)) * 100
    : 0;

  // Weighted total
  const totalScore = Math.round(
    visitedScore * 0.20 +
    styleScore * 0.20 +
    wishlistScore * 0.25 +
    budgetScore * 0.10 +
    monthsScore * 0.10 +
    interestsScore * 0.15
  );

  return {
    score: Math.min(100, totalScore),
    breakdown: {
      commonDestinations: Math.round(visitedScore),
      travelStyle: Math.round(styleScore),
      futureDestinations: Math.round(wishlistScore),
      budgetMatch: Math.round(budgetScore),
      travelDates: Math.round(monthsScore),
      sharedInterests: Math.round(interestsScore)
    },
    matches: {
      destinations: commonVisited,
      futureDestinations: commonWishlist,
      styles: commonStyles,
      interests: commonInterests,
      months: commonMonths
    }
  };
}

function parseList(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

module.exports = { calculateCompatibility };
