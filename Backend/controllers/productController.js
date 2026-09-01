import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";

// GET all products
// Supports:
// ?search=samsung
// ?category=electronics
// ?vendor=<vendorId>
// ?minPrice=10000
// ?maxPrice=100000
// ?sort=price_asc
// ?sort=price_desc
// ?page=1
// ?limit=12

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      vendor,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    // Start with an empty filter
    const filter = {};

    // Search by product name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by vendor (e.g. viewing one store's products)
    if (vendor) {
      filter.vendor = vendor;
    }

    // Filter by minimum and maximum price
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Sorting
    let sortOption = {};

    if (sort === "price_asc") {
      sortOption.price = 1;
    }

    if (sort === "price_desc") {
      sortOption.price = -1;
    }

    // Pagination
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find(filter)
      .populate("category", "name slug image")
      .populate("vendor", "storeName")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    // Count total matching products
    const totalProducts = await Product.countDocuments(filter);

    const totalPages = Math.ceil(totalProducts / limitNumber);

    res.json({
      products,
      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalProducts,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

// GET one product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug image")
      .populate("vendor", "storeName");

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};

// GET the logged-in vendor's own products
// Route: GET /api/products/mine (protect + vendorOnly)
export const getMyProducts = async (req, res) => {
  try {
    // Find the Vendor profile that belongs to this logged-in user
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor profile not found",
      });
    }

    const products = await Product.find({ vendor: vendor._id })
      .populate("category", "name slug image")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch your products",
    });
  }
};

// CREATE a product
// Route: POST /api/products (protect + vendorOnly)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      oldPrice,
      image,
      category,
      stock,
      tag,
      shipping,
    } = req.body;

    // IMPORTANT: we NEVER trust a vendor/vendorId sent from the frontend.
    // The backend looks up the Vendor profile that belongs to the
    // logged-in user (req.user._id) and uses THAT as the product's owner.
    const vendor = await Vendor.findOne({ user: req.user._id });

    // This should normally always exist, since a user only gets the
    // "vendor" role after their Vendor application is approved. We check
    // status as an extra safety net in case that ever changes.
    if (!vendor || vendor.status !== "approved") {
      return res.status(403).json({
        message: "Only approved vendors can create products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      oldPrice,
      image,
      category,
      stock,
      tag,
      shipping,
      vendor: vendor._id,
    });

    const populatedProduct = await product.populate([
      { path: "category", select: "name slug image" },
      { path: "vendor", select: "storeName" },
    ]);

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create product",
    });
  }
};

// UPDATE a product
// Route: PUT /api/products/:id (protect + vendorOrAdmin)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Ownership check: admins may edit any product. Vendors may only
    // edit products that belong to their OWN Vendor profile.
    if (req.user.role !== "admin") {
      const vendor = await Vendor.findOne({ user: req.user._id });

      const ownsProduct =
        vendor && product.vendor && product.vendor.toString() === vendor._id.toString();

      if (!ownsProduct) {
        return res.status(403).json({
          message: "You can only edit your own products",
        });
      }
    }

    // Never let the request body change who owns the product.
    const { vendor: _ignoredVendor, ...safeUpdates } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      safeUpdates,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("category", "name slug image")
      .populate("vendor", "storeName");

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update product",
    });
  }
};

// DELETE a product
// Route: DELETE /api/products/:id (protect + vendorOrAdmin)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Same ownership rule as updateProduct: admins can delete anything,
    // vendors can only delete their own products.
    if (req.user.role !== "admin") {
      const vendor = await Vendor.findOne({ user: req.user._id });

      const ownsProduct =
        vendor && product.vendor && product.vendor.toString() === vendor._id.toString();

      if (!ownsProduct) {
        return res.status(403).json({
          message: "You can only delete your own products",
        });
      }
    }

    await product.deleteOne();

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
};
