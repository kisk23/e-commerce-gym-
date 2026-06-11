import {
  authenticate,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import helmet from "helmet"

const isProduction = process.env.NODE_ENV === "production"

const helmetHandler = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: isProduction
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
})

const helmetMiddleware = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  return helmetHandler(req, res, next)
}

export default defineMiddlewares({
  routes: [
    // Phase 1: Global security headers (no CSP)
    {
      matcher: "*",
      middlewares: [helmetMiddleware],
    },
    {
      matcher: "/admin/bundles/*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: "/admin/subscriptions/*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: "/store/customers/me/subscriptions/*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/carts/:id/subscription-plan",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/carts/:id/subscription-discount",
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
