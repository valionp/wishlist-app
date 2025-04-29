import prisma from "../db.server.js";

export async function loader({ request, params }) {
  try {
    const url = new URL(request.url);
    const { customerId } = params;

    // Get query parameters
    const shop = url.searchParams.get("shop");
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

    // Security check: ensure the customer ID in the URL matches the logged-in customer
    if (loggedInCustomerId && customerId !== loggedInCustomerId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Unauthorized access"
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    try {
      const items = await prisma?.wishlistItem.findMany({
        where: {
          shopDomain: shop,
          customerId: customerId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const wishlist = items?.map((item) => ({
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
      console.error("Database error:", dbError);

      // If database fails, return empty wishlist
      return new Response(JSON.stringify({
        success: true,
        wishlist: [],
        databaseError: dbError.message
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error) {
    console.error("Wishlist API error:", error);

    // Return error response
    return new Response(JSON.stringify({
      success: false,
      message: "Error processing request",
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
