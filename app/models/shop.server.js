import prisma from "../db.server.js";

export default async function getShopSettings(shopDomain) {
  try {
    if (!shopDomain) {
      throw new Error("Shop domain is required");
    }

    const shop = await prisma.shop.findUnique({
      where: {
        shopDomain,
      },
    });

    if (!shop) {
      // Create default settings if shop doesn't exist
      return prisma.shop.create({
        data: {
          shopDomain,
          isActive: true,
          settings: JSON.stringify({
            useMetafields: true,
            pageTitle: "My Wishlist",
            buttonText: "Add to Wishlist",
            removeText: "Remove from Wishlist",
            buttonStyle: "button",
            iconOnly: false,
            displayOnCollection: true,
            displayOnProduct: true,
          }),
        },
      });
    }

    // Parse settings if stored as string
    if (shop.settings && typeof shop.settings === 'string') {
      try {
        shop.parsedSettings = JSON.parse(shop.settings);
      } catch (e) {
        shop.parsedSettings = {};
      }
    } else {
      shop.parsedSettings = shop.settings || {};
    }

    return shop;
  } catch (error) {
    console.error("Error getting shop settings:", error);
    // Return default shop object in case of error
    return {
      settings: JSON.stringify({
        useMetafields: true,
        pageTitle: "My Wishlist",
        buttonText: "Add to Wishlist",
        removeText: "Remove from Wishlist",
        buttonStyle: "button",
        iconOnly: false,
        displayOnCollection: true,
        displayOnProduct: true,
      }),
      parsedSettings: {
        useMetafields: true,
        pageTitle: "My Wishlist",
        buttonText: "Add to Wishlist",
        removeText: "Remove from Wishlist",
        buttonStyle: "button",
        iconOnly: false,
        displayOnCollection: true,
        displayOnProduct: true,
      }
    };
  }
}
