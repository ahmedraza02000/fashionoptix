"""Seed data for the FashionOptix demo database.
Same structure the frontend used, expanded to 24 products across 10 brands.
This stands in for the future scraped/live catalog (Phase 2)."""

BRANDS = ["Sapphire", "Khaadi", "J.", "Gul Ahmed", "Outfitters", "Limelight",
          "Nishat Linen", "Generation", "Ethnic", "Bonanza Satrangi"]

# brand, name, category, color, price, originalPrice, qualityScore, rating, material
PRODUCTS = [
 ("Sapphire","Premium Cotton Polo","Polos","White",2990,4200,89,4.6,"78% Cotton, 22% Polyester"),
 ("Sapphire","Slim Fit Chinos","Pants","Navy",3490,3990,81,4.2,"98% Cotton, 2% Elastane"),
 ("Outfitters","Oversized Pique Polo","Polos","White",2490,2990,84,4.3,"100% Cotton"),
 ("Outfitters","Relaxed Denim Jacket","Jackets","Black",5990,7490,83,4.1,"100% Denim"),
 ("Khaadi","Linen Casual Shirt","Shirts","Black",4490,5490,86,4.5,"100% Linen"),
 ("Khaadi","Embroidered Lawn Suit","Dresses","White",7490,9990,90,4.7,"100% Lawn Cotton"),
 ("J.","Summer Cotton Shirt","Shirts","Black",3490,3490,80,4.2,"100% Cotton"),
 ("J.","Formal Tailored Trouser","Pants","Black",4290,4990,85,4.4,"Blended Wool"),
 ("Gul Ahmed","Printed Lawn Dress","Dresses","Navy",6990,8490,88,4.7,"100% Cotton"),
 ("Gul Ahmed","Ready-to-Wear Kurta","Ethnic","White",3990,4990,82,4.3,"100% Cotton"),
 ("Limelight","Classic Crew T-Shirt","T-Shirts","White",1990,2490,78,4.1,"Blended"),
 ("Limelight","Stitched Party Wear","Dresses","Black",8990,10990,84,4.4,"Chiffon Blend"),
 ("Nishat Linen","Slub Cotton Shirt","Shirts","Navy",3990,4990,82,4.4,"100% Cotton"),
 ("Nishat Linen","Unstitched Lawn 3pc","Ethnic","White",5490,6490,86,4.5,"100% Lawn Cotton"),
 ("Generation","Denim Slim Jeans","Pants","Navy",4490,4990,79,4.0,"98% Cotton, 2% Elastane"),
 ("Generation","Graphic Print Tee","T-Shirts","Black",1790,2290,75,3.9,"100% Cotton"),
 ("Ethnic","Embroidered Kurti","Ethnic","Navy",3490,3990,83,4.3,"Cotton Silk"),
 ("Ethnic","Festive Shalwar Kameez","Ethnic","White",6490,7990,87,4.6,"100% Cotton"),
 ("Bonanza Satrangi","Formal Lawn Suit","Dresses","Navy",7990,9490,89,4.6,"100% Lawn Cotton"),
 ("Bonanza Satrangi","Casual Cotton Kurta","Ethnic","Black",3290,3790,81,4.2,"100% Cotton"),
 ("Servis","Everyday Canvas Sneakers","Shoes","White",4990,6490,85,4.4,"Canvas"),
 ("Servis","Running Sport Shoes","Shoes","Black",6990,8490,82,4.3,"Mesh & Synthetic"),
 ("Khaadi","Basic Cotton Polo","Polos","Navy",2790,3290,80,4.1,"100% Cotton"),
 ("Sapphire","Summer Linen Shirt","Shirts","White",4190,4990,87,4.5,"100% Linen"),
]

def price_history_for(price, original):
    """Deterministic 6-month curve derived from current vs original price.
    Not a live feed - synthesised from the two known data points so every
    product gets a plausible, reproducible trend."""
    months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    ratio = price / original
    curve = [1.0, 0.94, 0.90, 0.96, 0.85, ratio]
    return [(m, round(original * c / 10) * 10) for m, c in zip(months, curve)]
