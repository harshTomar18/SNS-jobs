'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterDataApi, BackendLocation } from '@/lib/scn-api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, MapPin } from 'lucide-react';

interface LocationCascadePickerProps {
  onAddLocation: (location: { id: number; label: string }) => void;
  excludeIds?: number[];
}

export function LocationCascadePicker({ onAddLocation, excludeIds = [] }: LocationCascadePickerProps) {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('');

  // Step 1: Fetch States
  const { data: states = [], isLoading: isLoadingStates } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'states'],
    queryFn: () => masterDataApi.getStates(),
  });

  // Step 2: Fetch Cities in selected State
  const { data: cities = [], isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'cities', selectedState],
    queryFn: () => masterDataApi.getCities(selectedState),
    enabled: !!selectedState,
  });

  // Step 3: Fetch Localities in selected City & State
  const { data: localities = [], isLoading: isLoadingLocalities } = useQuery<BackendLocation[]>({
    queryKey: ['master', 'locations', 'localities', selectedCity, selectedState],
    queryFn: () => masterDataApi.getLocalities(selectedCity, selectedState),
    enabled: !!selectedCity && !!selectedState,
  });

  // Reset dependent selectors when parents change
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity('');
    setSelectedLocalityId('');
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedLocalityId('');
  };

  const handleAdd = () => {
    const locId = Number(selectedLocalityId);
    if (!locId) return;

    const matched = localities.find((loc: BackendLocation) => loc.id === locId);
    if (!matched) return;

    const label = [matched.locality, matched.city, matched.state]
      .filter(Boolean)
      .join(', ');

    onAddLocation({ id: locId, label });
    // Reset picker inputs
    setSelectedState('');
    setSelectedCity('');
    setSelectedLocalityId('');
  };

  // Filter out already selected locality IDs
  const availableLocalities = localities.filter(
    (loc: BackendLocation) => !excludeIds.includes(loc.id)
  );

  return (
    <div className="space-y-4 p-4.5 bg-slate-50/50 border border-slate-100 rounded-2xl">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
        <MapPin className="h-4 w-4 text-blue-600" />
        <span>Add a Preferred Location</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Step 1: State Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            1. Select State
          </label>
          <Select value={selectedState} onValueChange={handleStateChange}>
            <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 h-9">
              <SelectValue placeholder={isLoadingStates ? "Loading..." : "Choose state"} />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]">
              {isLoadingStates ? (
                <div className="flex items-center justify-center p-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              ) : (
                states.map((state: string) => (
                  <SelectItem key={state} value={state} className="text-xs font-medium">
                    {state}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: City Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            2. Select City
          </label>
          <Select
            value={selectedCity}
            onValueChange={handleCityChange}
            disabled={!selectedState}
          >
            <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 h-9 disabled:opacity-50 disabled:bg-slate-100/50">
              <SelectValue placeholder={isLoadingCities ? "Loading..." : "Choose city"} />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]">
              {isLoadingCities ? (
                <div className="flex items-center justify-center p-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              ) : (
                cities.map((city: string) => (
                  <SelectItem key={city} value={city} className="text-xs font-medium">
                    {city}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Step 3: Locality Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            3. Select Locality
          </label>
          <Select
            value={selectedLocalityId}
            onValueChange={setSelectedLocalityId}
            disabled={!selectedCity}
          >
            <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 h-9 disabled:opacity-50 disabled:bg-slate-100/50">
              <SelectValue placeholder={isLoadingLocalities ? "Loading..." : "Choose locality"} />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]">
              {isLoadingLocalities ? (
                <div className="flex items-center justify-center p-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              ) : availableLocalities.length === 0 ? (
                <div className="p-2.5 text-xs text-slate-400 text-center">
                  {localities.length > 0 ? "All localities already added" : "No localities found"}
                </div>
              ) : (
                availableLocalities.map((loc: BackendLocation) => (
                  <SelectItem key={loc.id} value={String(loc.id)} className="text-xs font-medium">
                    {loc.locality}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!selectedLocalityId}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs py-1.5 px-4 flex items-center gap-1 shadow-sm disabled:opacity-50 disabled:hover:bg-blue-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Location
        </Button>
      </div>
    </div>
  );
}
