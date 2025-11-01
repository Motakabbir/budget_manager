/**
 * AddAssetDialog Component
 * Form for adding new assets with asset-type-specific fields
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateAsset } from '@/lib/hooks/use-asset-queries';
import type { AssetType, AssetCondition, PropertyType } from '@/lib/supabase/database.types';
import { toast } from 'sonner';

interface AddAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
    { value: 'property', label: 'Property' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'collectibles', label: 'Collectibles' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' },
];

const CONDITIONS: AssetCondition[] = ['excellent', 'good', 'fair', 'poor'];
const PROPERTY_TYPES: PropertyType[] = ['house', 'apartment', 'land', 'commercial'];

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
    // Basic fields
    const [assetType, setAssetType] = useState<AssetType>('property');
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentValue, setCurrentValue] = useState('');
    const [condition, setCondition] = useState<AssetCondition>('good');
    const [location, setLocation] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [purchaseLocation, setPurchaseLocation] = useState('');
    const [notes, setNotes] = useState('');

    // Depreciation fields
    const [depreciationRate, setDepreciationRate] = useState('');
    const [salvageValue, setSalvageValue] = useState('');
    const [usefulLifeYears, setUsefulLifeYears] = useState('');

    // Insurance fields
    const [isInsured, setIsInsured] = useState(false);
    const [insuranceProvider, setInsuranceProvider] = useState('');
    const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
    const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
    const [insurancePremium, setInsurancePremium] = useState('');

    // Warranty
    const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');

    // Property-specific fields
    const [propertyAddress, setPropertyAddress] = useState('');
    const [propertySizeSqft, setPropertySizeSqft] = useState('');
    const [propertyType, setPropertyType] = useState<PropertyType>('house');

    // Vehicle-specific fields
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [vehicleVin, setVehicleVin] = useState('');
    const [vehicleMileage, setVehicleMileage] = useState('');
    const [vehicleLicensePlate, setVehicleLicensePlate] = useState('');

    const { mutate: createAsset, isPending } = useCreateAsset();

    const resetForm = () => {
        setAssetType('property');
        setName('');
        setBrand('');
        setModel('');
        setPurchasePrice('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setCurrentValue('');
        setCondition('good');
        setLocation('');
        setSerialNumber('');
        setPurchaseLocation('');
        setNotes('');
        setDepreciationRate('');
        setSalvageValue('');
        setUsefulLifeYears('');
        setIsInsured(false);
        setInsuranceProvider('');
        setInsurancePolicyNumber('');
        setInsuranceExpiryDate('');
        setInsurancePremium('');
        setWarrantyExpiryDate('');
        setPropertyAddress('');
        setPropertySizeSqft('');
        setPropertyType('house');
        setVehicleMake('');
        setVehicleYear('');
        setVehicleVin('');
        setVehicleMileage('');
        setVehicleLicensePlate('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter asset name');
            return;
        }

        if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
            toast.error('Please enter a valid purchase price');
            return;
        }

        if (!currentValue || parseFloat(currentValue) <= 0) {
            toast.error('Please enter a valid current value');
            return;
        }

        createAsset(
            {
                asset_type: assetType,
                name: name.trim(),
                brand: brand.trim() || null,
                model: model.trim() || null,
                purchase_price: parseFloat(purchasePrice),
                purchase_date: purchaseDate,
                current_value: parseFloat(currentValue),
                condition,
                location: location.trim() || null,
                serial_number: serialNumber.trim() || null,
                purchase_location: purchaseLocation.trim() || null,
                notes: notes.trim() || null,
                depreciation_rate: depreciationRate ? parseFloat(depreciationRate) : null,
                salvage_value: salvageValue ? parseFloat(salvageValue) : null,
                useful_life_years: usefulLifeYears ? parseInt(usefulLifeYears) : null,
                is_insured: isInsured,
                insurance_provider: isInsured && insuranceProvider.trim() ? insuranceProvider.trim() : null,
                insurance_policy_number: isInsured && insurancePolicyNumber.trim() ? insurancePolicyNumber.trim() : null,
                insurance_expiry_date: isInsured && insuranceExpiryDate ? insuranceExpiryDate : null,
                insurance_premium: isInsured && insurancePremium ? parseFloat(insurancePremium) : null,
                warranty_expiry_date: warrantyExpiryDate || null,
                // Property-specific
                property_address: assetType === 'property' && propertyAddress.trim() ? propertyAddress.trim() : null,
                property_size_sqft: assetType === 'property' && propertySizeSqft ? parseFloat(propertySizeSqft) : null,
                property_type: assetType === 'property' ? propertyType : null,
                // Vehicle-specific
                vehicle_make: assetType === 'vehicle' && vehicleMake.trim() ? vehicleMake.trim() : null,
                vehicle_year: assetType === 'vehicle' && vehicleYear ? parseInt(vehicleYear) : null,
                vehicle_vin: assetType === 'vehicle' && vehicleVin.trim() ? vehicleVin.trim() : null,
                vehicle_mileage: assetType === 'vehicle' && vehicleMileage ? parseInt(vehicleMileage) : null,
                vehicle_license_plate: assetType === 'vehicle' && vehicleLicensePlate.trim() ? vehicleLicensePlate.trim() : null,
                // Required fields with defaults
                is_active: true,
                sale_date: null,
                sale_price: null,
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    resetForm();
                },
            }
        );
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Asset Type */}
                    <div className="space-y-2">
                        <Label htmlFor="asset_type">Asset Type *</Label>
                        <Select
                            value={assetType}
                            onValueChange={(value) => setAssetType(value as AssetType)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {ASSET_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Asset Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., MacBook Pro, Honda Civic, Gold Necklace"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Input
                                id="brand"
                                placeholder="e.g., Apple, Honda, Tiffany"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Input
                                id="model"
                                placeholder="e.g., 16-inch M3 Pro"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchase_price">Purchase Price *</Label>
                            <Input
                                id="purchase_price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="current_value">Current Value *</Label>
                            <Input
                                id="current_value"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="purchase_date">Purchase Date *</Label>
                            <Input
                                id="purchase_date"
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="condition">Condition</Label>
                            <Select value={condition} onValueChange={(value) => setCondition(value as AssetCondition)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONDITIONS.map((cond) => (
                                        <SelectItem key={cond} value={cond}>
                                            {cond.charAt(0).toUpperCase() + cond.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="e.g., Home Office, Garage"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Property-Specific Fields */}
                    {assetType === 'property' && (
                        <div className="space-y-4 pt-3 border-t">
                            <h3 className="font-semibold text-sm">Property Details</h3>
                            <div className="space-y-2">
                                <Label htmlFor="property_address">Address</Label>
                                <Input
                                    id="property_address"
                                    placeholder="123 Main St, City, State"
                                    value={propertyAddress}
                                    onChange={(e) => setPropertyAddress(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="property_type">Property Type</Label>
                                    <Select value={propertyType} onValueChange={(value) => setPropertyType(value as PropertyType)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROPERTY_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="property_size_sqft">Size (sq ft)</Label>
                                    <Input
                                        id="property_size_sqft"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={propertySizeSqft}
                                        onChange={(e) => setPropertySizeSqft(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vehicle-Specific Fields */}
                    {assetType === 'vehicle' && (
                        <div className="space-y-4 pt-3 border-t">
                            <h3 className="font-semibold text-sm">Vehicle Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vehicle_make">Make</Label>
                                    <Input
                                        id="vehicle_make"
                                        placeholder="e.g., Honda, Toyota"
                                        value={vehicleMake}
                                        onChange={(e) => setVehicleMake(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vehicle_year">Year</Label>
                                    <Input
                                        id="vehicle_year"
                                        type="number"
                                        min="1900"
                                        max={new Date().getFullYear() + 1}
                                        placeholder="2024"
                                        value={vehicleYear}
                                        onChange={(e) => setVehicleYear(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vehicle_vin">VIN</Label>
                                    <Input
                                        id="vehicle_vin"
                                        placeholder="17-digit VIN"
                                        value={vehicleVin}
                                        onChange={(e) => setVehicleVin(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vehicle_mileage">Mileage</Label>
                                    <Input
                                        id="vehicle_mileage"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={vehicleMileage}
                                        onChange={(e) => setVehicleMileage(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vehicle_license_plate">License Plate</Label>
                                <Input
                                    id="vehicle_license_plate"
                                    placeholder="ABC-1234"
                                    value={vehicleLicensePlate}
                                    onChange={(e) => setVehicleLicensePlate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Depreciation */}
                    <div className="space-y-4 pt-3 border-t">
                        <h3 className="font-semibold text-sm">Depreciation (Optional)</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="depreciation_rate">Annual Rate (%)</Label>
                                <Input
                                    id="depreciation_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="0.00"
                                    value={depreciationRate}
                                    onChange={(e) => setDepreciationRate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="salvage_value">Salvage Value</Label>
                                <Input
                                    id="salvage_value"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={salvageValue}
                                    onChange={(e) => setSalvageValue(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="useful_life_years">Useful Life (years)</Label>
                                <Input
                                    id="useful_life_years"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={usefulLifeYears}
                                    onChange={(e) => setUsefulLifeYears(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Insurance */}
                    <div className="space-y-4 pt-3 border-t">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_insured"
                                checked={isInsured}
                                onChange={(e) => setIsInsured(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="is_insured" className="font-semibold cursor-pointer">
                                This asset is insured
                            </Label>
                        </div>

                        {isInsured && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="insurance_provider">Insurance Provider</Label>
                                        <Input
                                            id="insurance_provider"
                                            placeholder="e.g., State Farm, Allstate"
                                            value={insuranceProvider}
                                            onChange={(e) => setInsuranceProvider(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="insurance_policy_number">Policy Number</Label>
                                        <Input
                                            id="insurance_policy_number"
                                            placeholder="Policy #"
                                            value={insurancePolicyNumber}
                                            onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="insurance_expiry_date">Expiry Date</Label>
                                        <Input
                                            id="insurance_expiry_date"
                                            type="date"
                                            value={insuranceExpiryDate}
                                            onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="insurance_premium">Annual Premium</Label>
                                        <Input
                                            id="insurance_premium"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={insurancePremium}
                                            onChange={(e) => setInsurancePremium(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Other Details */}
                    <div className="space-y-4 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="serial_number">Serial Number</Label>
                                <Input
                                    id="serial_number"
                                    placeholder="Serial/ID number"
                                    value={serialNumber}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="warranty_expiry_date">Warranty Expiry</Label>
                                <Input
                                    id="warranty_expiry_date"
                                    type="date"
                                    value={warrantyExpiryDate}
                                    onChange={(e) => setWarrantyExpiryDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="purchase_location">Purchase Location</Label>
                            <Input
                                id="purchase_location"
                                placeholder="e.g., Best Buy, Amazon, Local Dealer"
                                value={purchaseLocation}
                                onChange={(e) => setPurchaseLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any additional notes about this asset..."
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Adding...' : 'Add Asset'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
