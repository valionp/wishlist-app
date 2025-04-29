import prisma from "../db.server.js";

export async function action({ request, params }) {
  try {
    const url = new URL(request.url);
    const { customerId } = params;

    // Get shop from query parameters
    const shop = url.searchParams.get("shop");

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("Error parsing JSON body:", jsonError);
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid JSON payload",
        error: jsonError.message
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    const { product } = body;

    if (!product || !product.id) {
      return new Response(JSON.stringify({
        success: false,
        message: "Product data required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Process product data
    // From logs we can see price is in cents (4299 = $42.99)
    const productPrice = product.price / 100;

    // Get a proper image URL
    let productImage = '';
    if (product.featured_image) {
      // Convert relative URL to absolute if needed
      productImage = product.featured_image.startsWith('//')
        ? 'https:' + product.featured_image
        : product.featured_image;
    } else if (product.images && product.images.length > 0) {
      productImage = product.images[0].startsWith('//')
        ? 'https:' + product.images[0]
        : product.images[0];
    }

    try {
      // Check if item already exists
      const existingItem = await prisma.wishlistItem.findFirst({
        where: {
          shopDomain: shop,
          customerId: customerId,
          productId: product.id.toString(),
        },
      });

      if (existingItem) {
        // Update existing item
        await prisma.wishlistItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            productTitle: product.title,
            variantId: product.variants[0].id.toString(),
            productImage: productImage,
            productPrice: productPrice,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new item
        await prisma.wishlistItem.create({
          data: {
            customerId,
            productId: product.id.toString(),
            variantId: product.variants[0].id.toString(),
            productTitle: product.title,
            productImage: productImage,
            productHandle: product.handle,
            productPrice: productPrice,
            shopDomain: shop,
          },
        });
      }

      // Get updated wishlist
      const items = await prisma.wishlistItem.findMany({
        where: {
          shopDomain: shop,
          customerId: customerId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const wishlist = items.map((item) => ({
        id: item.productId,
        variantId: item.variantId,
        title: item.productTitle,
        image: item.productImage,
        handle: item.productHandle,
        price: item.productPrice.toString(),
        addedAt: item.createdAt,
        addedToCartAt: item.addedToCartAt,
      }));

      return new Response(JSON.stringify({
        success: true,
        wishlist
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      return new Response(JSON.stringify({
        success: false,
        message: "Database operation failed",
        error: dbError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error) {
    console.error("Add to wishlist error:", error);

    return new Response(JSON.stringify({
      success: false,
      message: "Error adding to wishlist",
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
