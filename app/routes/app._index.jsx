import React, { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server.js";
import getWishlistStats from "../models/wishlist.server.js";
import getShopSettings from "../models/shop.server.js";

import polarisPackage from "@shopify/polaris";
const {
  Page,
  Card,
  Text,
  EmptyState,
  Select,
  Box,
  BlockStack,
  InlineStack,
  Banner,
  Badge,
  ProgressBar,
  Icon,
  SkeletonBodyText,
  Divider
} = polarisPackage;

let HeartIcon, CartIcon, TrendingUpIcon, ArchiveIcon;
try {
  const icons = polarisPackage.Icon ? polarisPackage.Icon.source : {};
  HeartIcon = icons?.HeartMajor;
  CartIcon = icons?.CartMajor;
  TrendingUpIcon = icons?.TrendingUpMajor;
  ArchiveIcon = icons?.ArchiveMajor;
} catch (e) {
}

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  if (!session?.shop) {
    return json({
      stats: { totalItems: 0, topProducts: [], addToCartRate: "0.00" },
      settings: {},
      period: "30"
    });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "30";

  try {
    const stats = await getWishlistStats(session.shop, parseInt(period));
    const shop = await getShopSettings(session.shop);

    let parsedSettings = shop.parsedSettings || {};
    if (!parsedSettings) {
      if (typeof shop.settings === 'string') {
        try {
          parsedSettings = JSON.parse(shop.settings);
        } catch (e) {
          console.error("Error parsing shop settings:", e);
          parsedSettings = {};
        }
      } else if (typeof shop.settings === 'object') {
        parsedSettings = shop.settings;
      }
    }

    return json({
      stats,
      settings: parsedSettings,
      period
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    return json({
      stats: { totalItems: 0, topProducts: [], addToCartRate: "0.00" },
      settings: {},
      period
    });
  }
}

export default function Index() {
  const { stats, period } = useLoaderData();
  const submit = useSubmit();
  const [isLoading, setIsLoading] = useState(false);

  const handlePeriodChange = (value) => {
    setIsLoading(true);
    submit({ period: value }, { method: "get" });
    setTimeout(() => setIsLoading(false), 500);
  };

  const getPeriodText = () => {
    switch(period) {
      case '7': return 'the last 7 days';
      case '30': return 'the last 30 days';
      case '90': return 'the last 90 days';
      case '0': return 'all time';
      default: return 'the selected period';
    }
  };

  const renderStatistics = () => {
    if (isLoading) {
      return (
        <BlockStack gap="400">
          <Card>
            <SkeletonBodyText lines={2} />
          </Card>
          <Card>
            <SkeletonBodyText lines={4} />
          </Card>
          <Card>
            <SkeletonBodyText lines={8} />
          </Card>
        </BlockStack>
      );
    }

    if (!stats || stats.totalItems === 0) {
      return (
        <EmptyState
          heading="No wishlist data yet"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Once customers start adding products to their wishlists, you'll see statistics here.</p>
        </EmptyState>
      );
    }

    const topProduct = stats.topProducts && stats.topProducts.length > 0
      ? stats.topProducts[0]
      : null;

    return (
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd" fontWeight="bold">Time Period</Text>
              <Badge tone="info">{getPeriodText()}</Badge>
            </InlineStack>
            <Select
              label="Select time period for statistics"
              labelHidden
              options={[
                {label: 'Last 7 days', value: '7'},
                {label: 'Last 30 days', value: '30'},
                {label: 'Last 90 days', value: '90'},
                {label: 'All time', value: '0'}
              ]}
              value={period}
              onChange={handlePeriodChange}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="500">
            <Text variant="headingMd" fontWeight="bold">Wishlist Overview</Text>

            <InlineStack gap="500" wrap={false}>
              <Box padding="400" background="bg-surface-secondary" borderRadius="100" minWidth="200px">
                <BlockStack gap="200" align="center">
                  <InlineStack gap="200" align="center">
                    {HeartIcon ? <Icon source={HeartIcon} color="base" /> : null}
                    <Text variant="bodyMd" fontWeight="semibold">Total Wishlisted Items</Text>
                  </InlineStack>
                  <Text variant="headingXl" fontWeight="bold">{stats.totalItems}</Text>
                  <Text variant="bodySm">Products added to wishlists</Text>
                </BlockStack>
              </Box>

              <Box padding="400" background="bg-surface-secondary" borderRadius="100" minWidth="200px">
                <BlockStack gap="200" align="center">
                  <InlineStack gap="200" align="center">
                    {CartIcon ? <Icon source={CartIcon} color="base" /> : null}
                    <Text variant="bodyMd" fontWeight="semibold">Add to Cart Rate</Text>
                  </InlineStack>
                  <Text variant="headingXl" fontWeight="bold">{stats.addToCartRate}%</Text>
                  <Text variant="bodySm">Wishlisted items added to cart</Text>
                </BlockStack>
              </Box>

              {topProduct && (
                <Box padding="400" background="bg-surface-secondary" borderRadius="100" minWidth="200px">
                  <BlockStack gap="200" align="center">
                    <InlineStack gap="200" align="center">
                      {TrendingUpIcon ? <Icon source={TrendingUpIcon} color="base" /> : null}
                      <Text variant="bodyMd" fontWeight="semibold">Most Popular Item</Text>
                    </InlineStack>
                    <Text variant="headingMd" fontWeight="bold" alignment="center">{topProduct.title}</Text>
                    <Badge tone="success">{topProduct.percentage}% of all wishlists</Badge>
                  </BlockStack>
                </Box>
              )}
            </InlineStack>
          </BlockStack>
        </Card>

        <Card padding="0">
          <Box padding="400">
            <Text variant="headingMd" fontWeight="bold">Popular Products</Text>
          </Box>
          <Divider />
          <BlockStack gap="0">
            {stats.topProducts.map((product, index) => (
              <React.Fragment key={product.id}>
                {index > 0 && <Divider />}
                <Box padding="400">
                  <InlineStack gap="400" align="space-between" wrap={false}>
                    <InlineStack gap="400" wrap={false}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          width="60"
                          height="60"
                          style={{
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e1e3e5'
                          }}
                        />
                      ) : (
                        <Box width="60px" height="60px" background="bg-surface-secondary" borderRadius="100">
                          {ArchiveIcon ? (
                            <Box padding="300">
                              <Icon source={ArchiveIcon} color="base" />
                            </Box>
                          ) : null}
                        </Box>
                      )}
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="bold">{product.title}</Text>
                        <Text variant="bodySm">Product ID: {product.id}</Text>
                        <InlineStack gap="200" align="start">
                          <Badge tone="info">{product.count} {product.count === 1 ? 'time' : 'times'}</Badge>
                          <Badge tone="success">{product.percentage}%</Badge>
                        </InlineStack>
                      </BlockStack>
                    </InlineStack>
                  </InlineStack>
                </Box>
              </React.Fragment>
            ))}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" fontWeight="bold">Wishlist Insights</Text>

            <Banner tone="info">
              <BlockStack gap="200">
                <Text fontWeight="semibold">Performance Summary for {getPeriodText()}</Text>
                <Text>
                  Your store has {stats.totalItems} {stats.totalItems === 1 ? 'item' : 'items'} in
                  customer wishlists with a {stats.addToCartRate}% add-to-cart conversion rate.
                  {stats.topProducts.length > 0 && ` "${stats.topProducts[0].title}" is your most wishlisted product.`}
                </Text>
                {parseFloat(stats.addToCartRate) < 10 && (
                  <Text>
                    Consider creating a special promotion for wishlisted items to increase your add-to-cart rate.
                  </Text>
                )}
              </BlockStack>
            </Banner>
          </BlockStack>
        </Card>
      </BlockStack>
    );
  };

  return (
    <Page
      title="Wishlist Dashboard"
      subtitle="Monitor customer wishlists and engagement"
      primaryAction={{
        content: 'View Documentation',
        disabled: true
      }}
    >
      <BlockStack gap="500">
        {renderStatistics()}
      </BlockStack>
    </Page>
  );
}
