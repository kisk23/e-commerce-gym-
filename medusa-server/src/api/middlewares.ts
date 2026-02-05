import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/admin\/bundles(?:\/.*)?$/,
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
  ],
})
