import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator, TrendingDown } from 'lucide-react';

type DepreciationMethod = 'straight_line' | 'declining_balance';

export function DepreciationCalculator() {
    const [purchasePrice, setPurchasePrice] = useState<string>('10000');
    const [currentAge, setCurrentAge] = useState<string>('2');
    const [usefulLife, setUsefulLife] = useState<string>('10');
    const [method, setMethod] = useState<DepreciationMethod>('straight_line');
    const [results, setResults] = useState<{
        currentValue: number;
        totalDepreciation: number;
        annualDepreciation: number;
        depreciationRate: number;
        remainingLife: number;
        yearlyBreakdown: { year: number; value: number; depreciation: number }[];
    } | null>(null);

    const calculateDepreciation = () => {
        const price = parseFloat(purchasePrice) || 0;
        const age = parseFloat(currentAge) || 0;
        const life = parseFloat(usefulLife) || 1;

        if (price <= 0 || life <= 0) {
            alert('Please enter valid positive numbers');
            return;
        }

        if (age > life) {
            alert('Current age cannot exceed useful life');
            return;
        }

        let currentValue = price;
        let totalDepreciation = 0;
        const yearlyBreakdown: { year: number; value: number; depreciation: number }[] = [];

        if (method === 'straight_line') {
            // Straight-line depreciation
            const annualDepreciation = price / life;
            totalDepreciation = annualDepreciation * age;
            currentValue = price - totalDepreciation;

            // Generate yearly breakdown
            for (let year = 0; year <= Math.ceil(life); year++) {
                const value = Math.max(0, price - annualDepreciation * year);
                const depreciation = year > 0 ? Math.min(annualDepreciation, price - value) : 0;
                yearlyBreakdown.push({ year, value, depreciation });
            }

            setResults({
                currentValue: Math.max(0, currentValue),
                totalDepreciation,
                annualDepreciation,
                depreciationRate: (1 / life) * 100,
                remainingLife: Math.max(0, life - age),
                yearlyBreakdown,
            });
        } else {
            // Declining balance (double declining)
            const rate = (2 / life);
            let value = price;

            for (let year = 0; year <= Math.ceil(life); year++) {
                const yearDepreciation = year > 0 ? value * rate : 0;
                yearlyBreakdown.push({
                    year,
                    value: Math.max(0, value),
                    depreciation: Math.max(0, Math.min(yearDepreciation, value)),
                });
                value = Math.max(0, value - yearDepreciation);
            }

            currentValue = yearlyBreakdown[Math.floor(age)]?.value || 0;
            totalDepreciation = price - currentValue;

            setResults({
                currentValue: Math.max(0, currentValue),
                totalDepreciation,
                annualDepreciation: totalDepreciation / (age || 1),
                depreciationRate: rate * 100,
                remainingLife: Math.max(0, life - age),
                yearlyBreakdown,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Depreciation Calculator
                </CardTitle>
                <CardDescription>Calculate asset depreciation using different methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Input Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                        <Input
                            id="purchasePrice"
                            type="number"
                            min="0"
                            step="100"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(e.target.value)}
                            placeholder="10000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currentAge">Current Age (years)</Label>
                        <Input
                            id="currentAge"
                            type="number"
                            min="0"
                            step="0.1"
                            value={currentAge}
                            onChange={(e) => setCurrentAge(e.target.value)}
                            placeholder="2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="usefulLife">Useful Life (years)</Label>
                        <Input
                            id="usefulLife"
                            type="number"
                            min="1"
                            step="0.5"
                            value={usefulLife}
                            onChange={(e) => setUsefulLife(e.target.value)}
                            placeholder="10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="method">Depreciation Method</Label>
                        <select
                            id="method"
                            value={method}
                            onChange={(e) => setMethod(e.target.value as DepreciationMethod)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="straight_line">Straight-Line</option>
                            <option value="declining_balance">Declining Balance (Double)</option>
                        </select>
                    </div>
                </div>

                <Button onClick={calculateDepreciation} className="w-full">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Depreciation
                </Button>

                {/* Results */}
                {results && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Current Value</p>
                                <p className="text-xl font-bold text-green-600">
                                    ${results.currentValue.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Total Depreciation</p>
                                <p className="text-xl font-bold text-red-600">
                                    ${results.totalDepreciation.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Annual Depreciation</p>
                                <p className="text-xl font-bold">
                                    ${results.annualDepreciation.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Remaining Life</p>
                                <p className="text-xl font-bold">
                                    {results.remainingLife.toFixed(1)} years
                                </p>
                            </div>
                        </div>

                        {/* Yearly Breakdown Chart */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                Depreciation Timeline
                            </h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {results.yearlyBreakdown.map((item) => {
                                    const percentage = (item.value / parseFloat(purchasePrice)) * 100;
                                    return (
                                        <div key={item.year} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Year {item.year}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-muted-foreground">
                                                        Depreciation: ${item.depreciation.toLocaleString()}
                                                    </span>
                                                    <span className="font-medium min-w-[5rem] text-right">
                                                        ${item.value.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
