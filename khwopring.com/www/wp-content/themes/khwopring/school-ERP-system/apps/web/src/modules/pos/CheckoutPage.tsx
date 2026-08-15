import { useEffect, useState } from "react";
import { Search, ShoppingCart, Trash2 } from "lucide-react";
import { posApi, type SaleRecord } from "./pos.api";
import { inventoryApi, type InventoryItem, type Vendor } from "@/modules/inventory/inventory.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CartLine {
  inventoryItemId: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

const NO_CUSTOMER = "NONE";
const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE"] as const;

export function CheckoutPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customers, setCustomers] = useState<Vendor[]>([]);
  const [customerId, setCustomerId] = useState(NO_CUSTOMER);
  const [submitting, setSubmitting] = useState(false);

  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("CASH");
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    inventoryApi.listVendors({ pageSize: 200 }).then((r) => setCustomers(r.data.filter((v) => v.type === "CUSTOMER")));
  }, []);

  async function handleSearch() {
    const res = await inventoryApi.listItems({ search: search || undefined, pageSize: 10 });
    setResults(res.data);
  }

  function addToCart(item: InventoryItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.inventoryItemId === item.id);
      if (existing) {
        return prev.map((l) => (l.inventoryItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { inventoryItemId: item.id, description: item.name, unit: item.unit, quantity: 1, unitPrice: 0 }];
    });
  }

  function updateLine(id: string, patch: Partial<CartLine>) {
    setCart((prev) => prev.map((l) => (l.inventoryItemId === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.inventoryItemId !== id));
  }

  const total = cart.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const sale = await posApi.createSale({
        counterpartyId: customerId === NO_CUSTOMER ? undefined : customerId,
        items: cart.map((l) => ({
          inventoryItemId: l.inventoryItemId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      toast({ title: `Sale ${sale.saleNumber} completed` });
      setCompletedSale(sale);
      setPaymentAmount(String(Number(sale.totalAmount)));
      setCart([]);
      setCustomerId(NO_CUSTOMER);
    } catch (err) {
      toast({ title: "Checkout failed", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCollectPayment() {
    if (!completedSale || !paymentAmount) return;
    setCollecting(true);
    try {
      const result = await posApi.collectPayment(completedSale.id, {
        amount: Number(paymentAmount),
        method: paymentMethod,
      });
      toast({ title: "Payment recorded" });
      setCompletedSale(result.sale);
    } catch (err) {
      toast({ title: "Failed to record payment", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setCollecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-sm text-muted-foreground">Sell stock items and collect payment on the spot.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search inventory items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              />
            </div>
            {results.length > 0 && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-1">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => addToCart(item)}
                  >
                    <span>
                      {item.name} <span className="text-muted-foreground">({item.category})</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} in stock
                    </span>
                  </button>
                ))}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-28">Unit price</TableHead>
                  <TableHead className="w-28">Line total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((line) => (
                  <TableRow key={line.inventoryItemId}>
                    <TableCell>{line.description}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        className="h-8"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.inventoryItemId, { quantity: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-8"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.inventoryItemId, { unitPrice: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>{(line.quantity * line.unitPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      <button onClick={() => removeLine(line.inventoryItemId)} className="text-destructive hover:opacity-70">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {cart.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Cart is empty. Search and click an item to add it.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer (optional)</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Walk-in customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CUSTOMER}>Walk-in customer</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-sm">
              <span>Total</span>
              <span className="text-lg font-semibold">{total.toFixed(2)}</span>
            </div>
            <Button className="w-full" onClick={handleCheckout} disabled={submitting || cart.length === 0}>
              <ShoppingCart className="h-4 w-4" /> Complete sale
            </Button>

            {completedSale && (
              <div className="space-y-3 rounded-md border border-border p-3">
                <p className="text-sm font-medium">
                  Sale {completedSale.saleNumber} — Outstanding:{" "}
                  {(Number(completedSale.totalAmount) - Number(completedSale.paidAmount)).toFixed(2)}
                </p>
                {Number(completedSale.paidAmount) < Number(completedSale.totalAmount) && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Amount</Label>
                        <Input type="number" min={0} step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Method</Label>
                        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button size="sm" className="w-full" onClick={handleCollectPayment} disabled={collecting}>
                      Record payment
                    </Button>
                  </>
                )}
                {completedSale.payments[0]?.filePath && (
                  <a
                    href={`/uploads/${completedSale.payments[0].filePath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-primary hover:underline"
                  >
                    View receipt
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
