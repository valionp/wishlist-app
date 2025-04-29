import prisma from "../db.server.js";

export default async function getWishlistStats(shopDomain, period = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const totalCount = await prisma.wishlistItem.count({
      where: {
        shopDomain,
        createdAt: {
          gte: startDate,
        },
      },
    });

    if (totalCount === 0) {
      return {
        totalItems: 0,
        topProducts: [],
        addToCartRate: "0.00",
      };
    }

    const productCounts = await prisma.wishlistItem.groupBy({
      by: ['productId', 'productTitle', 'productImage'],
      where: {
        shopDomain,
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        productId: true
      },
      orderBy: {
        _count: {
          productId: 'desc'
        }
      },
      take: 10
    });

    const addedToCartCount = await prisma.wishlistItem.count({
      where: {
        shopDomain,
        createdAt: {
          gte: startDate,
        },
        addedToCartAt: {
          not: null,
        },
      },
    });

    const addToCartRate = totalCount > 0 ? (addedToCartCount / totalCount) * 100 : 0;

    return {
      totalItems: totalCount,
      topProducts: productCounts.map((product) => ({
        id: product.productId,
        title: product.productTitle,
        image: product.productImage,
        count: product._count.productId,
        percentage: ((product._count.productId / totalCount) * 100).toFixed(2),
      })),
      addToCartRate: addToCartRate.toFixed(2),
    };
  } catch (error) {
    console.error("Error getting wishlist stats:", error);

    return {
      totalItems: 0,
      topProducts: [],
      addToCartRate: "0.00",
    };
  }
}
