import { InventoryItemsPage } from "./InventoryItemsPage";
import { VendorsPage } from "./VendorsPage";
import { PurchaseOrdersPage } from "./PurchaseOrdersPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Folds stock items, vendors, and purchase orders into a single "Inventory & Purchasing" nav destination. */
export function InventoryPurchasingPage() {
  return (
    <Tabs defaultValue="items">
      <TabsList>
        <TabsTrigger value="items">Stock Items</TabsTrigger>
        <TabsTrigger value="vendors">Vendors</TabsTrigger>
        <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
      </TabsList>
      <TabsContent value="items">
        <InventoryItemsPage />
      </TabsContent>
      <TabsContent value="vendors">
        <VendorsPage />
      </TabsContent>
      <TabsContent value="purchase-orders">
        <PurchaseOrdersPage />
      </TabsContent>
    </Tabs>
  );
}
