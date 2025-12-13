import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaShoppingCart, 
  FaStar, 
  FaHeart, 
  FaRegHeart, 
  FaShippingFast, 
  FaStore, 
  FaCheck,
  FaBox,
  FaUser,
  FaShareAlt,
  FaTruck,
  FaShieldAlt
} from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useToast } from '../../components/common/Toast';

const UserShopProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const products = [
    {
      id: 1,
      name: 'Premium Dog Food',
      category: 'food',
      petType: 'dog',
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      price: 3999.99,
      priceINR: 3999.99,
      rating: 4.8,
      reviewCount: 124,
      seller: 'PetNutrition Co.',
      description: 'High-quality dog food made with real chicken and vegetables. Grain-free formula suitable for all breeds and life stages.',
      fullDescription: 'Our Premium Dog Food is specially formulated to provide complete nutrition for your beloved dog. Made with high-quality ingredients including real chicken as the primary protein source, combined with a variety of vegetables and essential nutrients. This grain-free formula is gentle on digestion and suitable for dogs of all breeds and life stages - from puppies to seniors.',
      inStock: true,
      freeShipping: true,
      weight: '5 kg',
      ingredients: ['Real Chicken', 'Brown Rice', 'Sweet Potato', 'Fish Meal', 'Vegetables', 'Essential Vitamins & Minerals'],
      benefits: ['High Protein Content', 'Grain-Free Formula', 'Improved Digestion', 'Shiny Coat', 'Healthy Teeth & Bones'],
      reviews: [
        { id: 1, author: 'Rajesh K.', rating: 5, text: 'My dog loves this food! Great quality and visible improvement in his coat.', date: '2024-01-15' },
        { id: 2, author: 'Priya S.', rating: 4, text: 'Good quality food at reasonable price. My pup enjoys it.', date: '2024-01-10' },
        { id: 3, author: 'Amit P.', rating: 5, text: 'Excellent product. Highly recommended for all dog owners.', date: '2024-01-05' }
      ]
    },
    {
      id: 2,
      name: 'Interactive Cat Toy',
      category: 'toys',
      petType: 'cat',
      image: 'https://images.unsplash.com/photo-1526336179256-1347bdb255ee?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      price: 1599.99,
      priceINR: 1599.99,
      rating: 4.7,
      reviewCount: 98,
      seller: 'FunPets',
      description: 'Electronic interactive toy that keeps your cat engaged and active. Features unpredictable movements and light patterns.',
      fullDescription: 'Entertain your feline friend with our Interactive Cat Toy! This electronic toy features unpredictable movements and mesmerizing light patterns that stimulate your cat\'s natural hunting instincts. Battery-powered with adjustable speed settings, it keeps your cat active and engaged, reducing boredom and behavioral issues.',
      inStock: true,
      freeShipping: false,
      weight: '200g',
      ingredients: [],
      benefits: ['Keeps Cats Active', 'Reduces Boredom', 'Improves Exercise', 'Light & Movement Stimulation', 'Adjustable Speed Settings'],
      reviews: [
        { id: 1, author: 'Neha M.', rating: 5, text: 'My cat is obsessed with this toy! Keeps her entertained for hours.', date: '2024-01-12' },
        { id: 2, author: 'Vikram R.', rating: 4, text: 'Good toy, but battery life could be better.', date: '2024-01-08' }
      ]
    },
    {
      id: 3,
      name: 'Orthopedic Pet Bed',
      category: 'beds',
      petType: 'all',
      image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      price: 6399.99,
      priceINR: 6399.99,
      rating: 4.9,
      reviewCount: 76,
      seller: 'ComfortPets',
      description: 'Memory foam pet bed that provides joint support and comfort. Removable, machine-washable cover with water-resistant liner.',
      fullDescription: 'Give your pet the ultimate comfort with our Orthopedic Pet Bed! Featuring premium memory foam that supports joints and provides relief for aging or arthritic pets. The bed includes a soft, removable cover that\'s machine-washable and a water-resistant liner for easy maintenance. Perfect for all pet types and sizes.',
      inStock: true,
      freeShipping: true,
      weight: '2 kg',
      ingredients: [],
      benefits: ['Joint Support', 'Memory Foam Comfort', 'Machine Washable Cover', 'Water Resistant Liner', 'Suitable for All Pets'],
      reviews: [
        { id: 1, author: 'Sarah C.', rating: 5, text: 'My elderly dog now sleeps much better. Highly recommended!', date: '2024-01-10' },
        { id: 2, author: 'Deepak T.', rating: 5, text: 'Excellent quality bed. Worth the investment.', date: '2024-01-05' },
        { id: 3, author: 'Lisa J.', rating: 4, text: 'Good bed, covers could be more durable.', date: '2023-12-28' }
      ]
    },
    {
      id: 4,
      name: 'Adjustable Dog Collar',
      category: 'accessories',
      petType: 'dog',
      image: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      price: 1279.99,
      priceINR: 1279.99,
      rating: 4.6,
      reviewCount: 112,
      seller: 'PetStyle',
      description: 'Durable nylon collar with quick-release buckle. Reflective stitching for nighttime visibility and adjustable for perfect fit.',
      fullDescription: 'Our Adjustable Dog Collar is crafted from durable nylon material with a quick-release buckle for easy on and off. The reflective stitching ensures your dog\'s visibility during evening walks. Available in multiple sizes to fit dogs of all breeds, with adjustable straps for a perfect fit.',
      inStock: true,
      freeShipping: false,
      weight: '100g',
      ingredients: [],
      benefits: ['Durable Nylon Material', 'Quick-Release Buckle', 'Reflective Stitching', 'Adjustable Fit', 'Lightweight Design'],
      reviews: [
        { id: 1, author: 'Rohit S.', rating: 5, text: 'Great collar! My dog is very comfortable with it.', date: '2024-01-11' }
      ]
    },
    {
      id: 5,
      name: 'Natural Cat Litter',
      category: 'supplies',
      petType: 'cat',
      image: 'https://images.unsplash.com/photo-1563398216289-4e5e877a816d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      price: 1999.99,
      priceINR: 1999.99,
      rating: 4.5,
      reviewCount: 87,
      seller: 'EcoPets',
      description: 'Biodegradable, dust-free cat litter made from natural plant fibers. Superior odor control and clumping ability.',
      fullDescription: 'Natural Cat Litter is an eco-friendly alternative to traditional clay litter. Made from renewable plant fibers, it\'s completely biodegradable and safe for the environment. This dust-free formula is gentle on your cat\'s respiratory system while providing superior odor control and excellent clumping properties.',
      inStock: false,
      freeShipping: true,
      weight: '5 kg',
      ingredients: ['Plant Fibers', 'Natural Odor Control', 'Biodegradable'],
      benefits: ['Biodegradable', 'Dust-Free', 'Superior Odor Control', 'Excellent Clumping', 'Eco-Friendly'],
      reviews: [
        { id: 1, author: 'Maya G.', rating: 5, text: 'Best litter I\'ve used! No dust and great smell control.', date: '2024-01-09' },
        { id: 2, author: 'Anoop K.', rating: 4, text: 'Good product, slightly pricey but worth it.', date: '2024-01-04' }
      ]
    },
    {
      id: 6,
      name: 'Dog Training Treats',
      category: 'food',
      petType: 'dog',
      image: 'https://images.unsplash.com/photo-1582798358481-d199fb7347bb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      price: 1039.99,
      priceINR: 1039.99,
      rating: 4.7,
      reviewCount: 64,
      seller: 'TrainingBuddies',
      description: 'Small, soft treats perfect for training sessions. Made with real meat and limited ingredients for sensitive stomachs.',
      fullDescription: 'Perfect for training sessions! Our Dog Training Treats are small and soft, making them ideal for reward-based training. Made with real meat and formulated with limited ingredients for dogs with sensitive stomachs. Each treat is portion-controlled to prevent overfeeding.',
      inStock: true,
      freeShipping: false,
      weight: '200g',
      ingredients: ['Real Meat', 'Sweet Potato', 'Chicken Broth', 'Natural Flavoring'],
      benefits: ['Perfect for Training', 'Real Meat Content', 'Limited Ingredients', 'Soft Texture', 'Suitable for Sensitive Stomachs'],
      reviews: [
        { id: 1, author: 'Kavya N.', rating: 5, text: 'My dog goes crazy for these treats! Great for training.', date: '2024-01-13' }
      ]
    },
    {
      id: 7,
      name: 'Pet Grooming Kit',
      category: 'grooming',
      petType: 'all',
      image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      price: 2799.99,
      priceINR: 2799.99,
      rating: 4.4,
      reviewCount: 53,
      seller: 'GroomPro',
      description: 'Complete grooming set including clippers, scissors, nail trimmer, and brushes. Suitable for all pet types and coat lengths.',
      fullDescription: 'Our comprehensive Pet Grooming Kit includes everything you need for professional-quality grooming at home. The set contains electric clippers, sharp scissors, nail trimmers, and various brushes suitable for all coat types. Keep your pet looking beautiful and healthy between professional grooming appointments.',
      inStock: true,
      freeShipping: true,
      weight: '1.5 kg',
      ingredients: [],
      benefits: ['Complete Grooming Set', 'Professional Quality', 'Suitable for All Pets', 'Includes Multiple Tools', 'Easy to Use'],
      reviews: [
        { id: 1, author: 'Harish D.', rating: 4, text: 'Good value for money. Makes grooming at home easy.', date: '2024-01-07' }
      ]
    },
    {
      id: 8,
      name: 'Automatic Pet Feeder',
      category: 'supplies',
      petType: 'all',
      image: 'https://images.unsplash.com/photo-1585090163844-8398079e540a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      price: 7199.99,
      priceINR: 7199.99,
      rating: 4.8,
      reviewCount: 92,
      seller: 'SmartPet',
      description: 'Programmable feeder with portion control and scheduling. Keeps your pet on a regular feeding schedule even when youre not home.',
      fullDescription: 'The Automatic Pet Feeder is a smart device that helps maintain your pet\'s healthy eating schedule. With programmable portions and scheduling, you can feed your pet at the exact times needed. Perfect for busy pet owners or multi-pet households. Features a built-in timer and portion control settings.',
      inStock: true,
      freeShipping: false,
      weight: '1 kg',
      ingredients: [],
      benefits: ['Programmable Schedule', 'Portion Control', 'Suitable for All Pets', 'Built-in Timer', 'Easy to Clean'],
      reviews: [
        { id: 1, author: 'Sandeep K.', rating: 5, text: 'Game changer! My pet is always fed on time.', date: '2024-01-14' },
        { id: 2, author: 'Pooja R.', rating: 4, text: 'Works well, but instructions could be clearer.', date: '2024-01-06' }
      ]
    },
    {
      id: 9,
      name: 'Calming Dog Jacket',
      category: 'accessories',
      petType: 'dog',
      image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      price: 3199.99,
      priceINR: 3199.99,
      rating: 4.6,
      reviewCount: 78,
      seller: 'PetComfort',
      description: 'Therapeutic pressure wrap that helps reduce anxiety in dogs during thunderstorms, fireworks, or separation.',
      fullDescription: 'Our Calming Dog Jacket uses gentle pressure technology similar to a weighted blanket to help reduce anxiety in dogs. Perfect for dogs who suffer from thunderstorm phobia, fireworks anxiety, or separation anxiety. The soft, breathable fabric is comfortable for extended wear and machine washable.',
      inStock: true,
      freeShipping: false,
      weight: '500g',
      ingredients: [],
      benefits: ['Reduces Anxiety', 'Gentle Pressure Technology', 'Breathable Fabric', 'Machine Washable', 'Therapeutic Effect'],
      reviews: [
        { id: 1, author: 'Anjali M.', rating: 5, text: 'This jacket has been a lifesaver during thunderstorms!', date: '2024-01-12' }
      ]
    }
  ];

  const product = products.find(p => p.id === parseInt(id));

  if (!product) {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">Sorry, the product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/user/marketplace')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Marketplace
          </button>
        </div>
      </UserLayout>
    );
  }

  const handleAddToCart = () => {
    if (!product.inStock) {
      toast.error('This product is out of stock');
      return;
    }

    try {
      const existingCart = JSON.parse(localStorage.getItem('petStoreCart') || '[]');
      const existingItem = existingCart.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        existingCart.push({
          ...product,
          quantity
        });
      }

      localStorage.setItem('petStoreCart', JSON.stringify(existingCart));
      toast.success(`${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart!`);
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add product to cart:', error);
      toast.error('Failed to add product to cart');
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/user/cart');
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <button
          onClick={() => navigate('/user/marketplace')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
        >
          <FaArrowLeft size={16} />
          Back to Marketplace
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            <div className="flex flex-col gap-4">
              <div className="bg-gray-100 rounded-lg overflow-hidden h-96">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {product.freeShipping && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <FaShippingFast size={12} />
                    Free Shipping
                  </span>
                )}
                {product.inStock ? (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <FaCheck size={12} />
                    In Stock
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <FaStore size={14} />
                    <span className="text-sm">{product.seller}</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}
                            size={16}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">{product.rating}</span>
                      <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={toggleFavorite}
                  className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {isFavorite ? (
                    <FaHeart className="text-red-500" size={20} />
                  ) : (
                    <FaRegHeart className="text-gray-500" size={20} />
                  )}
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-4xl font-bold text-blue-600">
                  ₹{product.priceINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-700">{product.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaBox className="text-blue-600" />
                    <span className="text-sm">Weight: {product.weight}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaTruck className="text-blue-600" />
                    <span className="text-sm">{product.freeShipping ? 'Free Delivery' : 'Paid Delivery'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-gray-700 font-medium">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center border-0 focus:outline-none"
                      min="1"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                      product.inStock
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaShoppingCart size={16} />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={!product.inStock}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      product.inStock
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Buy Now
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <FaShieldAlt size={16} />
                  <span className="font-medium">Secure & Trusted</span>
                </div>
                <p className="text-sm text-green-600">
                  ✓ Authentic products  ✓ Secure payments  ✓ Easy returns  ✓ 24/7 support
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex gap-6 px-6">
              {['overview', 'reviews'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Details</h3>
                  <p className="text-gray-700 leading-relaxed">{product.fullDescription}</p>
                </div>

                {product.ingredients.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.ingredients.map((ingredient, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Benefits</h3>
                  <ul className="space-y-2">
                    {product.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-700">
                        <FaCheck className="text-green-500" size={14} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-4xl font-bold text-gray-800">{product.rating}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}
                            size={16}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Based on {product.reviewCount} reviews</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {product.reviews.map(review => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">{review.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                  size={12}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserShopProductDetails;
