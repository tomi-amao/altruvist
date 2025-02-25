import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import BannerSummaryCard from "./BannerSummaryCard";

describe("BannerSummaryCard", () => {
  const mockBannerItems = [
    { title: "Total Skills", value: "42" },
    { title: "Active Projects", value: "5" },
  ];

  describe("welcome section", () => {
    it("should display welcome section when showWelcome is true", () => {
      render(
        <BannerSummaryCard
          date="2024-01-01"
          bannerItems={mockBannerItems}
          showWelcome={true}
        />,
      );

      const welcomeSection = screen.getByTestId("welcome-section");
      expect(welcomeSection).toBeDefined();
      expect(within(welcomeSection).getByText("Welcome Back")).toBeDefined();
      expect(screen.getByTestId("date-display")).toHaveTextContent(
        "2024-01-01",
      );
    });

    it("should not display welcome section when showWelcome is false", () => {
      render(
        <BannerSummaryCard
          date="2024-01-01"
          bannerItems={mockBannerItems}
          showWelcome={false}
        />,
      );

      expect(screen.queryByTestId("welcome-section")).toBeNull();
    });
  });

  describe("banner items", () => {
    it("should render all banner items with correct content", () => {
      render(<BannerSummaryCard bannerItems={mockBannerItems} />);

      const bannerItems = screen.getAllByTestId("banner-item");
      expect(bannerItems).toHaveLength(mockBannerItems.length);

      mockBannerItems.forEach((item, index) => {
        const bannerItem = bannerItems[index];
        expect(
          within(bannerItem).getByTestId("banner-item-title"),
        ).toHaveTextContent(item.title);
        expect(
          within(bannerItem).getByTestId("banner-item-value"),
        ).toHaveTextContent(item.value);
      });
    });

    it("should render empty banner items section when no items provided", () => {
      render(<BannerSummaryCard bannerItems={[]} />);

      const bannerItemsSection = screen.getByTestId("banner-items");
      expect(bannerItemsSection.children).toHaveLength(0);
    });
  });
});
