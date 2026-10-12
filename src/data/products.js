// NOTE: superseded by backend/seed_data.py + the SQLite database.
// Kept only as a reference / fallback if you ever run the frontend without
// the Python backend. The app itself now fetches from the backend API.
const rows = [
 ['Sapphire','Premium Cotton Polo','Polos','White',2990,4200,89,4.6,'78% Cotton, 22% Polyester'],
 ['Outfitters','Oversized Pique Polo','Polos','White',2490,2990,84,4.3,'100% Cotton'],
 ['Khaadi','Linen Casual Shirt','Shirts','Black',4490,5490,86,4.5,'100% Linen'],
 ['J.','Summer Cotton Shirt','Shirts','Black',3490,3490,80,4.2,'100% Cotton'],
 ['Gul Ahmed','Printed Lawn Dress','Dresses','Navy',6990,8490,88,4.7,'100% Cotton'],
 ['Limelight','Classic Crew T-Shirt','T-Shirts','White',1990,2490,78,4.1,'Blended'],
 ['Nishat Linen','Slub Cotton Shirt','Shirts','Navy',3990,4990,82,4.4,'100% Cotton'],
 ['Servis','Everyday Canvas Sneakers','Shoes','White',4990,6490,85,4.4,'Canvas'],
]
export const products = rows.map((r, i) => ({
  id: i + 1, brand: r[0], name: r[1], category: r[2], color: r[3], price: r[4], originalPrice: r[5],
  discount: Math.round((1 - r[4] / r[5]) * 100), qualityScore: r[6], rating: r[7], reviews: 300 + i * 97,
  material: r[8], sizes: ['S', 'M', 'L', 'XL'], availability: i === 5 ? 'Low Stock' : 'In Stock',
  breakdown: { 'Fabric durability': r[6] + 3, 'Color retention': r[6] - 2, 'Shrinkage resistance': r[6] - 5, 'Customer sentiment': r[6] + 2 },
  insight: r[6] > 85 ? 'Strong fabric durability signals' : 'Solid value; some shrinkage mentions',
  image: null, // set a URL here later; cards fall back to a tinted placeholder
}))
