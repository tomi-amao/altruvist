import * as React from "react";
import { render as rtlRender, screen, within } from "@testing-library/react";
import { BrowserRouter } from "react-router";

type WrapperOptions = {
  withRouter?: boolean;
};

function TestWrapper({
  children,
  withRouter = false,
}: {
  children: React.ReactNode;
  withRouter?: boolean;
}) {
  if (withRouter) {
    return React.createElement(BrowserRouter, null, children);
  }
  return React.createElement(
    "div",
    { "data-testid": "test-wrapper" },
    children,
  );
}

function render(ui: React.ReactElement, options: WrapperOptions = {}) {
  return rtlRender(ui, {
    wrapper: ({ children }) => TestWrapper({ children, ...options }),
    ...options,
  });
}

export { render, screen, within };
