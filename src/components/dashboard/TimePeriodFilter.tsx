import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TimePeriodFilterProps {
    timePeriod: 'day' | 'month' | 'year' | 'all' | 'custom';
    setTimePeriod: (value: 'day' | 'month' | 'year' | 'all' | 'custom') => void;
    customDateRange: {
        from: Date | undefined;
        to: Date | undefined;
    };
    setCustomDateRange: (value: { from: Date | undefined; to: Date | undefined }) => void;
    periodLabel: string;
}

export function TimePeriodFilter({
    timePeriod,
    setTimePeriod,
    customDateRange,
    setCustomDateRange,
    periodLabel,
}: TimePeriodFilterProps) {
    return (
        <Card className="shadow-lg">
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Time Period</p>
                            <p className="text-xs text-muted-foreground">{periodLabel}</p>
                        </div>
                    </div>
                    <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as typeof timePeriod)} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="day">Today</TabsTrigger>
                            <TabsTrigger value="month">Month</TabsTrigger>
                            <TabsTrigger value="year">Year</TabsTrigger>
                            <TabsTrigger value="custom">Custom</TabsTrigger>
                            <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                {timePeriod === 'custom' && (
                    <div className="mt-4 pt-4 border-t">
                        <Label className="text-sm font-medium mb-3 block">Select Date Range</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">From Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {customDateRange.from ? format(customDateRange.from, 'PPP') : 'Pick start date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={customDateRange.from}
                                            onSelect={(date) => setCustomDateRange({ ...customDateRange, from: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">To Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {customDateRange.to ? format(customDateRange.to, 'PPP') : 'Pick end date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={customDateRange.to}
                                            onSelect={(date) => setCustomDateRange({ ...customDateRange, to: date })}
                                            disabled={(date) => customDateRange.from ? date < customDateRange.from : false}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        {customDateRange.from && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-3 w-full"
                                onClick={() => setCustomDateRange({ from: undefined, to: undefined })}
                            >
                                Clear Date Range
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
