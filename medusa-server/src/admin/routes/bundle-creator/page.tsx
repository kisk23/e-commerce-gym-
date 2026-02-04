import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"

type ShoppingGoal = "bulk" | "cut"

type BundleItem = {
  vegetableId: string
  weightG: number
}

type Bundle = {
  id: string
  name: string
  description: string
  goal: ShoppingGoal
  discountPercent: number
  items: BundleItem[]
}

type VegetableOption = {
  id: string
  name: string
}

type AdminBundlesResponse = {
  bundles: Bundle[]
  vegetables: VegetableOption[]
}

const toWeightMap = (options: VegetableOption[]) => {
  return options.reduce<Record<string, number>>((acc, option) => {
    acc[option.id] = 0
    return acc
  }, {})
}

const BundleCreatorRoute = () => {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [vegetables, setVegetables] = useState<VegetableOption[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [goal, setGoal] = useState<ShoppingGoal>("bulk")
  const [discountPercent, setDiscountPercent] = useState(10)
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [message, setMessage] = useState("")

  const loadBundles = async () => {
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/admin/custom", {
        credentials: "include",
      })

      const data = (await response.json()) as AdminBundlesResponse

      setBundles(data.bundles || [])
      setVegetables(data.vegetables || [])
      setWeights(toWeightMap(data.vegetables || []))
    } catch {
      setMessage("Could not load bundles.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBundles()
  }, [])

  const bundleCountByGoal = useMemo(() => {
    return {
      bulk: bundles.filter((bundle) => bundle.goal === "bulk").length,
      cut: bundles.filter((bundle) => bundle.goal === "cut").length,
    }
  }, [bundles])

  const onWeightChange = (vegetableId: string, value: string) => {
    const parsed = Number(value)
    const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : 0

    setWeights((prev) => ({
      ...prev,
      [vegetableId]: Math.round(safeValue),
    }))
  }

  const create = async () => {
    setMessage("")

    if (!name.trim()) {
      setMessage("Bundle name is required.")
      return
    }

    const items = Object.entries(weights)
      .filter(([, weightG]) => weightG > 0)
      .map(([vegetableId, weightG]) => ({ vegetableId, weightG }))

    if (!items.length) {
      setMessage("Add at least one vegetable with weight > 0.")
      return
    }

    const response = await fetch("/admin/custom", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        goal,
        discountPercent,
        items,
      }),
    })

    if (!response.ok) {
      const body = (await response.json()) as { message?: string }
      setMessage(body.message || "Could not create bundle.")
      return
    }

    setName("")
    setDescription("")
    setGoal("bulk")
    setDiscountPercent(10)
    setWeights(toWeightMap(vegetables))
    setMessage("Bundle created.")

    await loadBundles()
  }

  return (
    <div style={{ padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
        Vegetable Bundle Creator
      </h1>

      <p>
        Create bundles for storefront recommendations. This is now managed in
        Admin instead of the storefront.
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <span>Bulk bundles: {bundleCountByGoal.bulk}</span>
        <span>Cut bundles: {bundleCountByGoal.cut}</span>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Bundle name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          Goal
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as ShoppingGoal)}
          >
            <option value="bulk">Bulk</option>
            <option value="cut">Cut</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          Discount (%)
          <input
            type="number"
            min={0}
            max={90}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
          />
        </label>

        <label style={{ display: "grid", gap: "0.35rem", gridColumn: "1 / -1" }}>
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        }}
      >
        {vegetables.map((vegetable) => (
          <label key={vegetable.id} style={{ display: "grid", gap: "0.35rem" }}>
            {vegetable.name} (g)
            <input
              type="number"
              min={0}
              step={10}
              value={weights[vegetable.id] ?? 0}
              onChange={(e) => onWeightChange(vegetable.id, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button type="button" onClick={create}>
          Create bundle
        </button>
        {message && <span>{message}</span>}
        {loading && <span>Loading...</span>}
      </div>

      <div style={{ display: "grid", gap: "0.6rem" }}>
        {bundles.map((bundle) => (
          <div
            key={bundle.id}
            style={{
              border: "1px solid #d6d6d6",
              borderRadius: "8px",
              padding: "0.75rem",
              display: "grid",
              gap: "0.35rem",
            }}
          >
            <strong>{bundle.name}</strong>
            <span>{bundle.description}</span>
            <span>
              Goal: {bundle.goal} | Discount: {bundle.discountPercent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Bundle Creator",
  nested: "/products",
})

export default BundleCreatorRoute
