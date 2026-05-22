import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/admin\/bundles(?:\/.*)?$/,
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: /^\/admin\/subscriptions(?:\/.*)?$/,
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: /^\/store\/customers\/me\/subscriptions(?:\/.*)?$/,
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: /^\/store\/carts\/[^/]+\/subscription-plan(?:\/.*)?$/,
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: /^\/store\/carts\/[^/]+\/subscription-discount(?:\/.*)?$/,
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/email-verification/status",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/email-verification/resend",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
