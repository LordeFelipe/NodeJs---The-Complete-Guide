const Product = require('../models/product');
const Cart = require('../models/cart');
const CartItem = require('../models/cart-item');

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      })
    })
    .catch(err => console.log(err))
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findByPk(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err))
};

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/'
      })
    })
    .catch(err => console.log(err))
};

exports.getCart = (req, res, next) => {
  req.user.getCart()
  .then(cart => {
    return cart.getProducts()
    .then(products => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(e => console.log(e))
  })
  .catch(e => console.log(e))
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart
  let newQuantity = 1
  req.user.getCart()
  .then(cart => {
    fetchedCart = cart
    return cart.getProducts({where: {id: prodId}})
  })
  .then(products => {
    let product
    if (products.length > 0){      
      product = products[0]
    }
    if (product) {
      const oldQuantity = product.cartItem.quantity
      newQuantity = oldQuantity + 1
      return product
    }
    return Product.findByPk(prodId)
  })
  .then(product => {
    return fetchedCart.addProduct(product, {through: {quantity: newQuantity}})
  })
  .then(() => {
    res.redirect('/cart');
  })
  .catch(e => console.log(e))
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.getCart()
  .then(cart => {
    return cart.getProducts({where: {id: prodId}})
  })
  .then((products) => {
    const product = products[0]
    product.cartItem.destroy();
  })
  .then(result => {
    res.redirect('/cart');
  })
  .catch(e => console.log(e))
};

exports.postOrder = (req, res, next) => {
  let fetchedCart;
  req.user.getCart()
  .then(cart => {
    fetchedCart = cart
    return cart.getProducts();
  })
  .then(products => {
    req.user.createOrder()
    .then(order => {
      order.addProducts(products.map(product => {
        product.orderItem = {quantity: product.cartItem.quantity}
        return product
      }))
    })
    .catch(e => console.log(e))
  })
  .then(() => {
    fetchedCart.setProducts(null)
  })
  .then(() => {
    res.redirect('/orders')
  })
  .catch(e => console.log(e))
}

exports.getOrders = (req, res, next) => {
  req.user.getOrders({include: ['products']})
  .then(orders => {
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders
    });
  })
  .catch(e => console.log(e))
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
