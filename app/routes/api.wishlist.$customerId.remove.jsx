import prisma from "../db.server.js";

export async function action({ request, params }) {
  try {
    const url = new URL(request.url);
    const { customerId } = params;

    // Get shop from query parameters
    const shop = url.searchParams.get("shop");

    // Parse the request body
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Product ID required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Remove the item
    await prisma.wishlistItem.deleteMany({
      where: {
        shopDomain: shop,
        customerId: customerId,
        productId: productId,
      },
    });

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
  } catch (error) {
    console.error("Remove from wishlist error:", error);

    return new Response(JSON.stringify({
      success: false,
      message: "Error removing from wishlist",
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
