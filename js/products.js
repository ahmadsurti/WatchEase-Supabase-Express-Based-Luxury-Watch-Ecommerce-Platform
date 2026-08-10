export const products = {
    '1':  { name: 'Heritage Slate',    price: '₹18,800',    priceNum: 18800,   category: 'Classic', description: 'A masterclass in industrial engineering. This timepiece features a brushed surgical-grade steel case, housing our signature Caliber-S movement.' },
    '2':  { name: 'Gold Skeleton',     price: '₹1,99,500',  priceNum: 199500,  category: 'Luxury',  description: 'An exquisite luxury timepiece featuring exposed mechanical movement and 18K gold plating. A true statement of sophistication.' },
    '3':  { name: 'Grand Gala Silver', price: '₹47,600',    priceNum: 47600,   category: 'Wedding', description: 'Elegant silver timepiece perfect for formal occasions. Features premium Swiss movement and scratch-resistant sapphire crystal.' },
    '4':  { name: 'Midnight Stealth',  price: '₹78,250',    priceNum: 78250,   category: 'Classic', description: 'Sleek all-black design with minimalist aesthetics. Perfect for the modern professional who values understated elegance.' },
    '5':  { name: 'Carbon Tourbillon', price: '₹2,88,000',  priceNum: 288000,  category: 'Luxury',  description: 'Ultra-premium carbon fiber case with visible tourbillon mechanism. Limited edition masterpiece for serious collectors.' },
    '6':  { name: 'Rosewood Eternal',  price: '₹55,300',    priceNum: 55300,   category: 'Wedding', description: 'Unique rosewood accents combined with premium metals. A timeless piece that celebrates natural beauty and precision engineering.' },
    '7':  { name: 'Lumière Rose',      price: '₹12,300',    priceNum: 12300,   category: 'Classic', description: 'Delicate rose gold timepiece with refined feminine aesthetics. Perfect size for elegant wrists.' },
    '8':  { name: 'Starlight Noir',    price: '₹45,600',    priceNum: 45600,   category: 'Wedding', description: 'Sophisticated evening wear timepiece with diamond markers. Perfect for gala events and special occasions.' },
    '9':  { name: 'Linear Modérne',    price: '₹38,700',    priceNum: 38700,   category: 'Classic', description: 'Bold square design that challenges traditional watch aesthetics. For the woman who dares to be different.' },
    '10': { name: 'Ivory Minimalist',  price: '₹90,500',    priceNum: 90500,   category: 'Classic', description: 'Pure minimalist design in ivory tones. Understated elegance for everyday sophistication.' },
    '11': { name: 'Aura Champagne',    price: '₹1,44,800',  priceNum: 144800,  category: 'Luxury',  description: 'Luxurious champagne gold with intricate detailing. A showstopper for the most exclusive events.' },
    '12': { name: 'Eclipse Mono',      price: '₹71,700',    priceNum: 71700,   category: 'Wedding', description: 'Monochromatic masterpiece with asymmetric design elements. Art meets horology.' },
}

export function getProductById(id) {
    return products[id] || null
}
