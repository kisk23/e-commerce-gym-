import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

type RenderEntry = {
  key: string
  item: HttpTypes.StoreCartLineItem
  groupedItems?: HttpTypes.StoreCartLineItem[]
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const sortedItems = items
    ? [...items].sort((a, b) => {
        return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      })
    : []

  const renderEntries: RenderEntry[] = sortedItems.length
    ? (() => {
        const bundleGroups = new Map<string, RenderEntry>()
        const entries: RenderEntry[] = []

        for (const item of sortedItems) {
          const metadata = (item.metadata || {}) as Record<string, unknown>
          const bundleTitle =
            typeof metadata.bundle_title === "string"
              ? metadata.bundle_title.trim()
              : ""
          const bundleType =
            typeof metadata.bundle_type === "string"
              ? metadata.bundle_type.trim()
              : ""
          const bundleOperationId =
            typeof metadata.bundle_operation_id === "string"
              ? metadata.bundle_operation_id.trim()
              : ""

          if (!bundleTitle) {
            entries.push({ key: item.id, item })
            continue
          }

          const groupKey = bundleOperationId
            ? `bundle-operation:${bundleOperationId}`
            : `${bundleType || "bundle"}:${bundleTitle.toLowerCase()}`
          const existing = bundleGroups.get(groupKey)

          if (existing) {
            existing.groupedItems = [...(existing.groupedItems || []), item]
            continue
          }

          const created: RenderEntry = {
            key: groupKey,
            item,
            groupedItems: [item],
          }
          bundleGroups.set(groupKey, created)
          entries.push(created)
        }

        return entries
      })()
    : []

  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem]">Cart</Heading>
      </div>
      <Table>
        <Table.Header className="border-t-0"></Table.Header>
        <Table.Body>
          {items
            ? renderEntries.map((entry) => {
                return (
                  <Item
                    key={entry.key}
                    item={entry.item}
                    groupedItems={entry.groupedItems}
                    currencyCode={cart?.currency_code}
                  />
                )
              })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsTemplate
