const db = require("../config/db");

// Create order
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection(); // Assume db.getConnection() returns a MySQL connection instance

  try {
    const user_id = req.decodedUser.id; // Assuming you're using JWT for authentication
    const {
      company,
      delivery_date,
      payment_method,
      sub_total,
      tax,
      tax_amount,
      delivery_fee,
      total,
      user_delivery_address_id,
      products,
    } = req.body;

    // Start transaction
    await connection.beginTransaction();

    // Insert into `orders` table
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (company, created_by, delivery_date, payment_method, sub_total, tax, tax_amount, delivery_fee, total, user_delivery_address_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company,
        user_id,
        delivery_date,
        payment_method,
        sub_total,
        tax,
        tax_amount,
        delivery_fee,
        total,
        user_delivery_address_id,
      ]
    );

    const orderId = orderResult.insertId; // Get the inserted order ID

    // Insert products into `order_products` table
    for (let product of products) {
      const { product_id, quantity, price } = product;
      await connection.execute(
        `INSERT INTO order_products (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, product_id, quantity, price]
      );
    }

    // Commit transaction
    await connection.commit();

    // Success response
    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order_id: orderId,
    });
  } catch (error) {
    // Rollback transaction in case of error
    await connection.rollback();

    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the order",
      error: error.message,
    });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
};

// Create order for admin
exports.createOrderForAdmin = async (req, res) => {
  const connection = await db.getConnection(); // Assume db.getConnection() returns a MySQL connection instance

  try {
    const user_id = req.params.id;
    const {
      company,
      delivery_date,
      payment_method,
      sub_total,
      tax,
      tax_amount,
      delivery_fee,
      total,
      user_delivery_address_id,
      products,
    } = req.body;

    // Start transaction
    await connection.beginTransaction();

    // Insert into `orders` table
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (company, created_by, delivery_date, payment_method, sub_total, tax, tax_amount, delivery_fee, total, user_delivery_address_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company,
        user_id,
        delivery_date,
        payment_method,
        sub_total,
        tax,
        tax_amount,
        delivery_fee,
        total,
        user_delivery_address_id,
      ]
    );

    const orderId = orderResult.insertId; // Get the inserted order ID

    // Insert products into `order_products` table
    for (let product of products) {
      const { product_id, quantity, price } = product;
      await connection.execute(
        `INSERT INTO order_products (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, product_id, quantity, price]
      );
    }

    // Commit transaction
    await connection.commit();

    // Success response
    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order_id: orderId,
    });
  } catch (error) {
    // Rollback transaction in case of error
    await connection.rollback();

    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the order",
      error: error.message,
    });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
};

// Get order by ID with products, images, and delivery address
exports.getOrderById = async (req, res) => {
  try {
    const order_id = req.params.id; // Get the order ID from the request parameters

    // Fetch order details from the `orders` table and join with `user_delivery_address`
    const [orderResult] = await db.execute(
      `SELECT 
          o.*, 
          uda.phone, 
          uda.contact, 
          uda.address, 
          uda.address_type, 
          uda.city, 
          uda.post_code, 
          uda.message
       FROM orders o
       LEFT JOIN user_delivery_address uda ON o.user_delivery_address_id = uda.id
       WHERE o.id = ?`,
      [order_id]
    );

    // Check if order exists
    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const [userInfo] = await db.query(`SELECT * FROM users WHERE id=? `, [
      orderResult[0].id,
    ]);

    const order = orderResult[0]; // Order information

    // Organize delivery address data
    const userDeliveryAddress = {
      phone: order.phone,
      contact: order.contact,
      address: order.address,
      address_type: order.address_type,
      city: order.city,
      post_code: order.post_code,
      message: order.message,
    };

    // Remove address fields from the `order` object to avoid redundancy
    delete order.phone;
    delete order.contact;
    delete order.address;
    delete order.address_type;
    delete order.city;
    delete order.post_code;
    delete order.message;

    // Fetch products associated with the order along with their images
    const [productsResult] = await db.execute(
      `SELECT 
          op.product_id, 
          p.name, 
          op.quantity, 
          op.price, 
          pi.id as image_id, 
          pi.image_url 
       FROM order_products op 
       LEFT JOIN products p ON p.id = op.product_id 
       LEFT JOIN product_images pi ON pi.product_id = op.product_id 
       WHERE op.order_id = ?`,
      [order_id]
    );

    // Organize products by combining the images
    const productsMap = {};

    productsResult.forEach((product) => {
      if (!productsMap[product.product_id]) {
        productsMap[product.product_id] = {
          product_id: product.product_id,
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          images: [],
        };
      }

      if (product.image_id) {
        productsMap[product.product_id].images.push({
          id: product.image_id,
          image_url: product.image_url,
        });
      }
    });

    const products = Object.values(productsMap);

    // Add products and delivery address to the order object
    order.userInfo = userInfo[0];
    order.products = products;
    order.user_delivery_address = userDeliveryAddress;

    // Success response
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the order",
      error: error.message,
    });
  }
};

// get all user order for admin
exports.getAllUserOrderForAdmin = async (req, res) => {
  try {
    // Capture the order_status from query parameters
    const { order_status } = req.query;
    const user_id = req.params.id;

    // SQL query for fetching all orders with an optional order_status filter
    let ordersQuery = `
      SELECT 
        o.*, 
        uda.phone, 
        uda.contact, 
        uda.address, 
        uda.address_type, 
        uda.city, 
        uda.post_code, 
        uda.message
      FROM orders o
      LEFT JOIN user_delivery_address uda ON o.user_delivery_address_id = uda.id
      WHERE o.created_by = ?
    `;

    // Add WHERE clause if order_status filter is provided
    if (order_status) {
      ordersQuery += ` WHERE o.order_status = ?`;
    }

    // Add ORDER BY clause to sort by order id in descending order
    ordersQuery += ` ORDER BY o.id DESC`;

    // Execute the query with or without parameters based on the presence of order_status
    const [ordersResult] = order_status
      ? await db.execute(ordersQuery, [user_id, order_status])
      : await db.execute(ordersQuery, [user_id]);

    // Check if any orders exist
    if (ordersResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    // Fetch products for all orders with their images
    const [productsResult] = await db.execute(
      `SELECT 
              op.order_id, 
              op.product_id, 
              p.name, 
              op.quantity, 
              op.price, 
              pi.id as image_id, 
              pi.image_url 
            FROM order_products op 
            LEFT JOIN products p ON p.id = op.product_id 
            LEFT JOIN product_images pi ON pi.product_id = op.product_id`
    );

    // Map to store orders by order ID
    const ordersMap = {};

    // Iterate over orders to organize them
    ordersResult.forEach((order) => {
      const userDeliveryAddress = {
        phone: order.phone,
        contact: order.contact,
        address: order.address,
        address_type: order.address_type,
        city: order.city,
        post_code: order.post_code,
        message: order.message,
      };

      // Remove address fields from the order object
      delete order.phone;
      delete order.contact;
      delete order.address;
      delete order.address_type;
      delete order.city;
      delete order.post_code;
      delete order.message;

      // Initialize the order in the ordersMap with products and delivery address
      ordersMap[order.id] = {
        ...order,
        products: [],
        user_delivery_address: userDeliveryAddress,
      };
    });

    // Organize products by associating them with the correct order
    productsResult.forEach((product) => {
      if (ordersMap[product.order_id]) {
        const order = ordersMap[product.order_id];

        // Find the existing product in the order's products list
        let productEntry = order.products.find(
          (p) => p.product_id === product.product_id
        );

        // If the product is not already in the list, add it
        if (!productEntry) {
          productEntry = {
            product_id: product.product_id,
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            images: [],
          };
          order.products.push(productEntry);
        }

        // Add the product image to the product's image list
        if (product.image_id) {
          productEntry.images.push({
            id: product.image_id,
            image_url: product.image_url,
          });
        }
      }
    });

    // Convert the ordersMap to an array of orders
    const orders = Object.values(ordersMap);

    // Success response
    return res.status(200).json({
      success: true,
      totalOrders: orders.length,
      message: "Get User All Orders",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the orders",
      error: error.message,
    });
  }
};

// get all user order
exports.getAllUserOrder = async (req, res) => {
  try {
    // Capture the order_status from query parameters
    const { order_status } = req.query;
    const user_id = req.decodedUser.id;

    // SQL query for fetching all orders with an optional order_status filter
    let ordersQuery = `
      SELECT 
        o.*, 
        uda.phone, 
        uda.contact, 
        uda.address, 
        uda.address_type, 
        uda.city, 
        uda.post_code, 
        uda.message
      FROM orders o
      LEFT JOIN user_delivery_address uda ON o.user_delivery_address_id = uda.id
      WHERE o.created_by = ?
    `;

    // Add WHERE clause if order_status filter is provided
    if (order_status) {
      ordersQuery += ` WHERE o.order_status = ?`;
    }

    // Add ORDER BY clause to sort by order id in descending order
    ordersQuery += ` ORDER BY o.id DESC`;

    // Execute the query with or without parameters based on the presence of order_status
    const [ordersResult] = order_status
      ? await db.execute(ordersQuery, [user_id, order_status])
      : await db.execute(ordersQuery, [user_id]);

    // Check if any orders exist
    if (ordersResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    // Fetch products for all orders with their images
    const [productsResult] = await db.execute(
      `SELECT 
              op.order_id, 
              op.product_id, 
              p.name, 
              op.quantity, 
              op.price, 
              pi.id as image_id, 
              pi.image_url 
            FROM order_products op 
            LEFT JOIN products p ON p.id = op.product_id 
            LEFT JOIN product_images pi ON pi.product_id = op.product_id`
    );

    // Map to store orders by order ID
    const ordersMap = {};

    // Iterate over orders to organize them
    ordersResult.forEach((order) => {
      const userDeliveryAddress = {
        phone: order.phone,
        contact: order.contact,
        address: order.address,
        address_type: order.address_type,
        city: order.city,
        post_code: order.post_code,
        message: order.message,
      };

      // Remove address fields from the order object
      delete order.phone;
      delete order.contact;
      delete order.address;
      delete order.address_type;
      delete order.city;
      delete order.post_code;
      delete order.message;

      // Initialize the order in the ordersMap with products and delivery address
      ordersMap[order.id] = {
        ...order,
        products: [],
        user_delivery_address: userDeliveryAddress,
      };
    });

    // Organize products by associating them with the correct order
    productsResult.forEach((product) => {
      if (ordersMap[product.order_id]) {
        const order = ordersMap[product.order_id];

        // Find the existing product in the order's products list
        let productEntry = order.products.find(
          (p) => p.product_id === product.product_id
        );

        // If the product is not already in the list, add it
        if (!productEntry) {
          productEntry = {
            product_id: product.product_id,
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            images: [],
          };
          order.products.push(productEntry);
        }

        // Add the product image to the product's image list
        if (product.image_id) {
          productEntry.images.push({
            id: product.image_id,
            image_url: product.image_url,
          });
        }
      }
    });

    // Convert the ordersMap to an array of orders
    const orders = Object.values(ordersMap);

    // Success response
    return res.status(200).json({
      success: true,
      totalOrders: orders.length,
      message: "Get User All Orders",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the orders",
      error: error.message,
    });
  }
};

// get all order
exports.getAllOrders = async (req, res) => {
  try {
    const { order_status, fromDate, toDate, user_id } = req.query;

    let ordersQuery = `
      SELECT 
        o.*, 
        uda.phone, 
        uda.contact, 
        uda.address, 
        uda.address_type, 
        uda.city, 
        uda.post_code, 
        uda.message
      FROM orders o
      LEFT JOIN user_delivery_address uda ON o.user_delivery_address_id = uda.id
    `;

    const whereClauses = [];
    const queryParams = [];

    if (order_status) {
      whereClauses.push(`o.order_status = ?`);
      queryParams.push(order_status);
    }

    if (user_id) {
      whereClauses.push(`o.created_by = ?`);
      queryParams.push(user_id);
    }

    if (fromDate && toDate) {
      const fromDateString = `${fromDate} 00:00:00`;
      const toDateString = `${toDate} 23:59:59`;

      whereClauses.push(`o.created_at BETWEEN ? AND ?`);
      queryParams.push(fromDateString, toDateString);
    }

    if (whereClauses.length > 0) {
      ordersQuery += ` WHERE ` + whereClauses.join(" AND ");
    }

    ordersQuery += ` ORDER BY o.id DESC`;

    const [ordersResult] = await db.execute(ordersQuery, queryParams);

    if (ordersResult.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No orders found",
        data: [],
      });
    }

    const [productsResult] = await db.execute(
      `SELECT 
          op.order_id, 
          op.product_id, 
          p.name, 
          op.quantity, 
          op.price, 
          pi.id as image_id, 
          pi.image_url 
        FROM order_products op 
        LEFT JOIN products p ON p.id = op.product_id 
        LEFT JOIN product_images pi ON pi.product_id = op.product_id`
    );

    const ordersMap = {};

    ordersResult.forEach((order) => {
      const userDeliveryAddress = {
        phone: order.phone,
        contact: order.contact,
        address: order.address,
        address_type: order.address_type,
        city: order.city,
        post_code: order.post_code,
        message: order.message,
      };

      delete order.phone;
      delete order.contact;
      delete order.address;
      delete order.address_type;
      delete order.city;
      delete order.post_code;
      delete order.message;

      ordersMap[order.id] = {
        ...order,
        products: [],
        user_delivery_address: userDeliveryAddress,
      };
    });

    productsResult.forEach((product) => {
      if (ordersMap[product.order_id]) {
        const order = ordersMap[product.order_id];

        let productEntry = order.products.find(
          (p) => p.product_id === product.product_id
        );

        if (!productEntry) {
          productEntry = {
            product_id: product.product_id,
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            images: [],
          };
          order.products.push(productEntry);
        }

        if (product.image_id) {
          productEntry.images.push({
            id: product.image_id,
            image_url: product.image_url,
          });
        }
      }
    });

    const orders = Object.values(ordersMap);

    return res.status(200).json({
      success: true,
      totalOrders: orders.length,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the orders",
      error: error.message,
    });
  }
};

// update order status
exports.orderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId) {
      return res.status(404).send({
        success: false,
        message: "order Id is required in params",
      });
    }

    const { order_status } = req.body;
    if (!order_status) {
      return res.status(404).send({
        success: false,
        message: "order_status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM orders WHERE id=? `, [
      orderId,
    ]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Order found",
      });
    }

    await db.query(`UPDATE orders SET order_status=?  WHERE id =?`, [
      order_status,
      orderId,
    ]);

    res.status(200).send({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update order status ",
      error: error.message,
    });
  }
};

// Update Order Product Price and Order Details
exports.updateOrderProductPrice = async (req, res) => {
  const connection = await db.getConnection(); // Assume db.getConnection() returns a MySQL connection instance

  try {
    const order_id = req.params.id;
    const {
      company,
      created_by,
      delivery_date,
      payment_method,
      sub_total,
      tax,
      tax_amount,
      delivery_fee,
      total,
      products,
    } = req.body;

    // Start transaction
    await connection.beginTransaction();

    // Check if the order exists
    const [orderData] = await connection.query(
      `SELECT * FROM orders WHERE id = ?`,
      [order_id]
    );

    if (!orderData || orderData.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Order found",
      });
    }

    // Update `orders` table with the new values
    const [orderResult] = await connection.execute(
      `UPDATE orders SET company = ?, created_by = ?, delivery_date =?, payment_method = ?, sub_total = ?, tax = ?, tax_amount = ?, delivery_fee = ?, total = ? WHERE id = ?`,
      [
        company || orderData[0].company,
        created_by || orderData[0].created_by,
        delivery_date || orderData[0].delivery_date,
        payment_method || orderData[0].payment_method,
        sub_total || orderData[0].sub_total,
        tax || orderData[0].tax,
        tax_amount || orderData[0].tax_amount,
        delivery_fee || orderData[0].delivery_fee,
        total || orderData[0].total,
        order_id,
      ]
    );

    let totalUpdatedRows = orderResult.changedRows; // Track total updated rows
    let totalInsertedRows = 0; // Track total inserted rows

    // Update products in the `order_products` table
    if (products) {
      for (let product of products) {
        const { product_id, price, quantity } = product;

        // Check if the product exists in the order
        const [productData] = await connection.query(
          `SELECT * FROM order_products WHERE order_id = ? AND product_id = ?`,
          [order_id, product_id]
        );

        if (productData && productData.length > 0) {
          // Update existing product in the order
          const [orderProduct] = await connection.execute(
            `UPDATE order_products SET price = ?, quantity = ? WHERE order_id = ? AND product_id = ?`,
            [price, quantity, order_id, product_id]
          );
          totalUpdatedRows += orderProduct.changedRows;
        } else {
          // If the product doesn't exist, insert it as a new product for this order
          const [insertProductData] = await connection.execute(
            `INSERT INTO order_products (order_id, product_id, price, quantity) VALUES (?, ?, ?, ?)`,
            [order_id, product_id, price, quantity]
          );
          totalInsertedRows += insertProductData.affectedRows;
        }
      }
    }

    // Commit transaction
    await connection.commit();

    if (totalUpdatedRows === 0 && totalInsertedRows === 0) {
      return res.status(201).json({
        success: true,
        message: "No Data change",
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: "Order and product prices updated successfully",
    });
  } catch (error) {
    // Rollback transaction in case of error
    await connection.rollback();

    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the order",
      error: error.message,
    });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
};

// get all array order
exports.getAllArrayOrders = async (req, res) => {
  try {
    const { ordersID } = req.query;

    const orderIdsArray = `(${ordersID.map((item) => `'${item}'`).join(", ")})`;

    // Fetch orders
    const [ordersResult] = await db.execute(
      `SELECT 
          o.*, 
          uda.phone, 
          uda.contact, 
          uda.address, 
          uda.address_type, 
          uda.city, 
          uda.post_code, 
          uda.message
        FROM orders o
        LEFT JOIN user_delivery_address uda ON o.user_delivery_address_id = uda.id
        WHERE o.id IN ${orderIdsArray}
        ORDER BY o.id DESC;`
    );

    if (ordersResult.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No orders found",
        data: [],
      });
    }

    // Fetch all products for the orders
    const [orProducts] = await db.execute(
      `SELECT or_pro.*,
      pro.name,
      pro.unit,
      or_pro.order_id
      FROM order_products or_pro
      LEFT JOIN products pro ON or_pro.product_id = pro.id
      WHERE or_pro.order_id IN ${orderIdsArray}`
    );

    // Get all product IDs
    const productIds = orProducts.map((item) => item.product_id);

    // Fetch images for all product IDs
    const [images] = await db.query(
      `SELECT * FROM product_images WHERE product_id IN (?)`,
      [productIds]
    );

    // Map images by product_id for easier access
    const imageMap = {};
    images.forEach((image) => {
      imageMap[image.product_id] = image;
    });

    // Attach images to the corresponding product
    orProducts.forEach((product) => {
      const imageData = imageMap[product.product_id];
      product.image = imageData ? imageData.image_url : ""; // If image data is undefined, set an empty string
    });

    // Group products by order_id
    const productsByOrderId = {};
    orProducts.forEach((product) => {
      if (!productsByOrderId[product.order_id]) {
        productsByOrderId[product.order_id] = [];
      }
      productsByOrderId[product.order_id].push(product);
    });

    // Attach products to each order
    ordersResult.forEach((order) => {
      order.products = productsByOrderId[order.id] || []; // Default to empty array if no products
    });

    return res.status(200).json({
      success: true,
      data: ordersResult,
      allProducts: orProducts,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the orders",
      error: error.message,
    });
  }
};

// get all order
exports.getOrders = async (req, res) => {
  try {
    const { order_status, fromDate, toDate, user_id } = req.query;

    let ordersQuery = `
      SELECT 
        o.*, 
        uda.phone, 
        uda.contact, 
        uda.address, 
        uda.address_type, 
        uda.city, 
        uda.post_code, 
        uda.message
      FROM orders o
      LEFT JOIN user_delivery_address uda ON o.user_delivery_address_id = uda.id
    `;

    const whereClauses = [];
    const queryParams = [];

    if (order_status) {
      whereClauses.push(`o.order_status = ?`);
      queryParams.push(order_status);
    }

    if (user_id) {
      whereClauses.push(`o.created_by = ?`);
      queryParams.push(user_id);
    }

    if (fromDate && toDate) {
      const fromDateString = `${fromDate} 00:00:00`;
      const toDateString = `${toDate} 23:59:59`;

      whereClauses.push(`o.created_at BETWEEN ? AND ?`);
      queryParams.push(fromDateString, toDateString);
    }

    if (whereClauses.length > 0) {
      ordersQuery += ` WHERE ` + whereClauses.join(" AND ");
    }

    ordersQuery += `ORDER BY o.id DESC`;

    const [ordersResult] = await db.execute(ordersQuery, queryParams);

    if (ordersResult.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No orders found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      totalOrders: ordersResult.length,
      data: ordersResult,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the orders",
      error: error.message,
    });
  }
};
