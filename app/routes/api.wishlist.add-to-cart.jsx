import prisma from "../db.server.js";

export async function action({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

    const { productId, customerId, variantId } = await request.json();

    if (!productId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Product ID is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Optional check: prevent updating someone else's wishlist
    if (loggedInCustomerId && customerId !== loggedInCustomerId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Unauthorized access"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const currentDate = new Date();

    const updateResult = await prisma.wishlistItem.updateMany({
      where: {
        shopDomain: shop,
        productId: productId.toString(),
        ...(customerId ? { customerId: customerId.toString() } : {}),
        ...(variantId ? { variantId: variantId.toString() } : {})
      },
      data: {
        addedToCartAt: currentDate
      }
    });

    console.log(`Updated ${updateResult.count} wishlist items as added to cart`, {
      shop,
      productId,
      customerId,
      variantId,
      addedToCartAt: currentDate
    });

    return new Response(JSON.stringify({
      success: true,
      updatedCount: updateResult.count,
      message: `Successfully tracked ${updateResult.count} item(s) as added to cart`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error updating wishlist item:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to track add to cart event",
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function loader({ request }) {
  return new Response(JSON.stringify({
    success: false,
    message: "Method not allowed"
  }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
}
