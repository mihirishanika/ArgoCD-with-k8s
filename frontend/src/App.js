import React, {useEffect, useMemo, useState} from 'react';

const fallbackProducts = [
  {id: 1, name: 'Basic T-Shirt', price: 9.99, stock: 100},
  {id: 2, name: 'Coffee Mug', price: 7.5, stock: 50},
  {id: 3, name: 'Sticker Pack', price: 2.99, stock: 200},
  {id: 4, name: 'Hoodie', price: 29.99, stock: 40},
  {id: 5, name: 'Baseball Cap', price: 14.99, stock: 80},
  {id: 6, name: 'Socks (3-pack)', price: 6.99, stock: 120},
  {id: 7, name: 'Notebook', price: 3.5, stock: 300},
  {id: 8, name: 'Water Bottle', price: 12.0, stock: 75},
  {id: 9, name: 'Sticker - Logo', price: 1.99, stock: 500},
  {id: 10, name: 'Keychain', price: 4.25, stock: 150},
  {id: 11, name: 'Phone Stand', price: 8.5, stock: 60},
  {id: 12, name: 'Tote Bag', price: 11.0, stock: 90},
  {id: 13, name: 'Poster', price: 7.0, stock: 45},
  {id: 14, name: 'Beanie', price: 9.0, stock: 120},
  {id: 15, name: 'Sunglasses', price: 19.99, stock: 40},
  {id: 16, name: 'Leather Wallet', price: 24.5, stock: 30},
  {id: 17, name: 'Desk Mat', price: 18.0, stock: 70},
  {id: 18, name: 'Mousepad', price: 7.99, stock: 150},
  {id: 19, name: 'Sticker Set (5)', price: 5.5, stock: 400},
  {id: 20, name: 'Canvas Print', price: 25.0, stock: 25},
  {id: 21, name: 'Planner', price: 13.75, stock: 85},
  {id: 22, name: 'Bluetooth Speaker', price: 34.99, stock: 22},
  {id: 23, name: 'USB-C Cable', price: 6.49, stock: 200}
  ,{id: 24, name: 'Wireless Charger', price: 19.99, stock: 80},
  {id: 25, name: 'Laptop Sleeve', price: 21.5, stock: 60},
  {id: 26, name: 'Travel Mug', price: 15.0, stock: 110},
  {id: 27, name: 'Wireless Earbuds', price: 49.99, stock: 35},
  {id: 28, name: 'Notebook Pro', price: 17.75, stock: 40},
  {id: 29, name: 'Desk Lamp', price: 22.0, stock: 28},
  {id: 30, name: 'Key Organizer', price: 9.5, stock: 140},
  {id: 31, name: 'Magnetic Phone Mount', price: 12.99, stock: 95},
  {id: 32, name: 'Sticker Mega Pack', price: 9.99, stock: 320},
  {id: 33, name: 'Eco Straw Set', price: 4.99, stock: 260}
];

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [page, setPage] = useState('shop');
  const [orderAccepted, setOrderAccepted] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('currentUser') || 'null'));
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(null);
  const [signupForm, setSignupForm] = useState({name: '', email: '', password: ''});
  const [loginForm, setLoginForm] = useState({email: '', password: ''});
  const [authTab, setAuthTab] = useState('signup');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/products');
        const data = await response.json();
        if (Array.isArray(data) && data.length) {
          setProducts(data);
        }
      } catch (error) {
        setProducts(fallbackProducts);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // initialize redirect target from localStorage and respond to ?auth=1
  useEffect(() => {
    const stored = localStorage.getItem('redirectAfterAuth');
    if (stored) setRedirectAfterAuth(stored);

    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === '1') {
      setPage('auth');
      params.delete('auth');
      const url = new URL(window.location);
      url.search = params.toString();
      window.history.replaceState({}, '', url.toString());
    }

    const onStorage = (e) => {
      if (e.key === 'currentUser') {
        setCurrentUser(JSON.parse(localStorage.getItem('currentUser') || 'null'));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const nextCart = [...currentCart];
      const found = nextCart.find((item) => item.id === product.id);
      if (found) {
        found.qty += 1;
      } else {
        nextCart.push({...product, qty: 1});
      }
      return nextCart;
    });
  };

  const updateQty = (id, delta) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => (item.id === id ? {...item, qty: item.qty + delta} : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0).toFixed(2),
    [cart]
  );

  const placeOrder = () => {
    if (!currentUser) {
      setAuthMessage('Please login or signup before accepting the order.');
      setPage('login');
      return;
    }

    setOrderAccepted(false);
    setPage('cart');
  };

  const saveOrder = async () => {
    const response = await fetch('/orders', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        customerEmail: currentUser?.email || 'guest',
        items: cart,
        total: cartTotal
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save order');
    }

    return response.json();
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setAuthMessage('');
    try {
      const response = await fetch('http://localhost:4010/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(signupForm)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      const user = {email: signupForm.email, userId: data.id};
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuthMessage('Signup successful. You are now signed in.');
      const target = localStorage.getItem('redirectAfterAuth') || redirectAfterAuth;
      if (target) {
        localStorage.removeItem('redirectAfterAuth');
        setRedirectAfterAuth(null);
        setPage(target);
      } else {
        setPage('shop');
      }
    } catch (error) {
      setAuthMessage(error.message);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthMessage('');
    try {
      const response = await fetch('http://localhost:4010/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(loginForm)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      const user = {email: loginForm.email, token: data.token};
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuthMessage('Login successful.');
      // if a redirect target was set in localStorage, use it
      const target = localStorage.getItem('redirectAfterAuth') || redirectAfterAuth;
      if (target) {
        localStorage.removeItem('redirectAfterAuth');
        setRedirectAfterAuth(null);
        setPage(target);
      } else {
        setPage('shop');
      }
    } catch (error) {
      setAuthMessage(error.message);
    }
  };

  const handleAcceptOrder = async () => {
    try {
      if (!currentUser) {
        // open a new tab to the combined auth page and set redirect target
        localStorage.setItem('redirectAfterAuth', 'cart');
        window.open(window.location.origin + '/?auth=1', '_blank');
        return;
      }

      await saveOrder();
      setOrderAccepted(true);
      setCart([]);
      alert('Order saved successfully.');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMessage('Logged out');
    setPage('shop');
  };

  const navButton = (targetPage, label) => (
    <button
      type="button"
      onClick={() => setPage(targetPage)}
        style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.2)',
        background: page === targetPage ? '#ff7a59' : 'transparent',
        color: '#fff',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Arial, sans-serif'}}>
      <header style={{background: '#112240', color: '#fff', padding: '24px 20px'}}>
        <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>
            <h1 style={{margin: 0}}>Mini Shop</h1>
          </div>
          <nav style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
            {navButton('shop', 'Shopping Page')}
            {navButton('cart', `Cart (${cart.length})`)}
            {!currentUser && navButton('auth', 'Login')}
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                style={{padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer'}}
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      {currentUser && (
        <div style={{maxWidth: 1100, margin: '16px auto 0', padding: '0 20px'}}>
          <div style={{background: '#e6f4ea', border: '1px solid #c9e7d0', borderRadius: 12, padding: 12}}>
            Signed in as <strong>{currentUser.email}</strong>
          </div>
        </div>
      )}

      <main style={{padding: 20}}>
        {page === 'shop' && (
          <section style={{maxWidth: 1100, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 8px 24px rgba(17,34,64,0.08)'}}>
            <h2 style={{marginTop: 0}}>Shopping Page</h2>
            <p style={{marginTop: 0, color: '#586174'}}>Browse products and add items to your cart.</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              style={{width: '100%', padding: 12, marginBottom: 16, borderRadius: 10, border: '1px solid #d7dce5'}}
            />
            <div style={{display: 'grid', gap: 12}}>
              {filteredProducts.map((product) => (
                <article key={product.id} style={{border: '1px solid #e6eaf2', borderRadius: 12, padding: 16}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12}}>
                    <div>
                      <h3 style={{margin: '0 0 4px'}}>{product.name}</h3>
                      <div style={{color: '#586174'}}>Stock: {product.stock}</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontSize: 20, fontWeight: 700}}>${Number(product.price).toFixed(2)}</div>
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(product);
                          setPage('cart');
                        }}
                        style={{marginTop: 8, padding: '10px 14px', border: 'none', borderRadius: 10, background: '#ff7a59', color: '#fff', cursor: 'pointer'}}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === 'cart' && (
          <section style={{maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 8px 24px rgba(17,34,64,0.08)'}}>
            <h2 style={{marginTop: 0}}>Cart Page</h2>
            <p style={{marginTop: 0, color: '#586174'}}>Review items in your cart before checkout.</p>

            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div style={{display: 'grid', gap: 12}}>
                {cart.map((item) => (
                  <div key={item.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 16, border: '1px solid #e6eaf2', borderRadius: 12}}>
                    <div>
                      <div style={{fontWeight: 700}}>{item.name}</div>
                      <div style={{color: '#586174'}}>${Number(item.price).toFixed(2)} each</div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <button type="button" onClick={() => updateQty(item.id, -1)} style={{width: 36, height: 36, borderRadius: 10, border: '1px solid #d7dce5', background: '#fff'}}>−</button>
                      <strong>{item.qty}</strong>
                      <button type="button" onClick={() => updateQty(item.id, 1)} style={{width: 36, height: 36, borderRadius: 10, border: '1px solid #d7dce5', background: '#fff'}}>+</button>
                      <button type="button" onClick={() => removeItem(item.id)} style={{padding: '10px 12px', borderRadius: 10, border: 'none', background: '#ff7a59', color: '#fff'}}>Remove</button>
                    </div>
                  </div>
                ))}

                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700, fontSize: 18}}>
                  <span>Total</span>
                  <span>${cartTotal}</span>
                </div>

                <button
                  type="button"
                  onClick={handleAcceptOrder}
                  disabled={cart.length === 0}
                  style={{padding: '14px 16px', border: 'none', borderRadius: 10, background: cart.length === 0 ? '#9aa7b8' : '#112240', color: '#fff', cursor: cart.length === 0 ? 'not-allowed' : 'pointer'}}
                >
                  Accept
                </button>
              </div>
            )}
          </section>
        )}

        {/* Accepting page removed - flow handled from Cart and Auth */}

        {page === 'auth' && (
          <section style={{maxWidth: 920, margin: '0 auto', display: 'flex', justifyContent: 'center', padding: 20}}>
            <div style={{width: '100%', display: 'flex', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.15)'}}>
              <div style={{flex: 1, background: '#112240', color: '#fff', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                <h2 style={{margin: 0, fontSize: 32}}>Welcome Back!</h2>
                <p style={{opacity: 0.9, marginTop: 12, textAlign: 'center'}}>Enter your personal details to use all of site features</p>
                <button onClick={() => { setAuthTab('login'); setAuthMessage(''); }} style={{marginTop: 20, padding: '12px 28px', borderRadius: 8, border: '2px solid rgba(255,255,255,0.6)', background: 'transparent', color: '#fff', cursor: 'pointer'}}>SIGN IN</button>
              </div>

              <div style={{width: 480, background: '#fff', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                {authTab === 'signup' ? (
                  <div>
                    <h3 style={{marginTop:0}}>Create Account</h3>
                    <form onSubmit={handleSignup} style={{display: 'grid', gap: 12, marginTop: 12}}>
                      <input type="text" placeholder="Name" value={signupForm.name} onChange={(e)=> setSignupForm({...signupForm, name: e.target.value})} style={{padding:12,borderRadius:8,border:'1px solid #e6e9ef'}} />
                      <input type="email" placeholder="Email" value={signupForm.email} onChange={(e)=> setSignupForm({...signupForm, email: e.target.value})} style={{padding:12,borderRadius:8,border:'1px solid #e6e9ef'}} />
                      <input type="password" placeholder="Password" value={signupForm.password} onChange={(e)=> setSignupForm({...signupForm, password: e.target.value})} style={{padding:12,borderRadius:8,border:'1px solid #e6e9ef'}} />
                      <button type="submit" style={{marginTop:8, padding:12, borderRadius:8, background:'#112240', color:'#fff', border:'none'}}>SIGN UP</button>
                      <div style={{marginTop:12, textAlign:'center'}}>
                        <span>Already have an account? </span>
                        <button type="button" onClick={()=> setAuthTab('login')} style={{background:'none', border:'none', color:'#112240', cursor:'pointer'}}>Sign in</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div>
                    <h3 style={{marginTop:0}}>Sign In</h3>
                    <form onSubmit={handleLogin} style={{display: 'grid', gap: 12, marginTop: 12}}>
                      <input type="email" placeholder="Email" value={loginForm.email} onChange={(e)=> setLoginForm({...loginForm, email: e.target.value})} style={{padding:12,borderRadius:8,border:'1px solid #e6e9ef'}} />
                      <input type="password" placeholder="Password" value={loginForm.password} onChange={(e)=> setLoginForm({...loginForm, password: e.target.value})} style={{padding:12,borderRadius:8,border:'1px solid #e6e9ef'}} />
                      <button type="submit" style={{marginTop:8, padding:12, borderRadius:8, background:'#112240', color:'#fff', border:'none'}}>Login</button>
                      <div style={{marginTop:12, textAlign:'center'}}>
                        <span>Don't have an account? </span>
                        <button type="button" onClick={()=> setAuthTab('signup')} style={{background:'none', border:'none', color:'#112240', cursor:'pointer'}}>Create account</button>
                      </div>
                    </form>
                  </div>
                )}
                {authMessage ? <div style={{marginTop:12,color:'#b45309'}}>{authMessage}</div> : null}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
