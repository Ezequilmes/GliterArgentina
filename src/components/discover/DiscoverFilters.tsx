'use client';

import React, { useState } from 'react';
import { Card, Button, Slider, Select, Switch, Badge } from '@/components/ui';
import { Filter, X, MapPin, Users, Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOptions {
  ageRange: [number, number];
  maxDistance: number;
  showMe: 'men' | 'women' | 'everyone';
  sexualRole: 'active' | 'passive' | 'versatile' | 'any';
  onlineOnly: boolean;
  verifiedOnly: boolean;
  premiumOnly: boolean;
  hasPhotos: boolean;
  interests: string[];
}

interface DiscoverFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

const INTERESTS_OPTIONS = [
  'Oral', 'Anal', 'Besos', 'Caricias', 'Masajes', 'Juguetes', 'Roleplay',
  'BDSM', 'Fetichismo', 'Exhibicionismo', 'Voyeurismo', 'Threesome', 'Orgías',
  'Sexo tántrico', 'Sexo al aire libre', 'Sexo en público', 'Dominación',
  'Sumisión', 'Bondage', 'Spanking', 'Wax play', 'Crossdressing'
];

export function DiscoverFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  className
}: DiscoverFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleAgeRangeChange = (values: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      ageRange: [values[0], values[1]]
    }));
  };

  const handleDistanceChange = (values: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      maxDistance: values[0]
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setLocalFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const defaultFilters: FilterOptions = {
      ageRange: [18, 50],
      maxDistance: 50,
      showMe: 'everyone',
      sexualRole: 'any',
      onlineOnly: false,
      verifiedOnly: false,
      premiumOnly: false,
      hasPhotos: true,
      interests: []
    };
    setLocalFilters(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.onlineOnly) count++;
    if (localFilters.verifiedOnly) count++;
    if (localFilters.premiumOnly) count++;
    if (localFilters.interests.length > 0) count++;
    if (localFilters.ageRange[0] !== 18 || localFilters.ageRange[1] !== 50) count++;
    if (localFilters.maxDistance !== 50) count++;
    if (localFilters.showMe !== 'everyone') count++;
    if (localFilters.sexualRole !== 'any') count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <Card 
        variant="default" 
        padding="none"
        className={cn(
          "w-full max-w-lg max-h-[90vh] overflow-y-auto",
          "sm:rounded-lg rounded-t-lg",
          className
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Filtros
            </h2>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="primary" className="text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Rango de edad: {localFilters.ageRange[0]} - {localFilters.ageRange[1]} años
            </label>
            <Slider
              value={localFilters.ageRange}
              onValueChange={handleAgeRangeChange}
              min={18}
              max={80}
              step={1}
              className="w-full"
            />
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Distancia máxima: {localFilters.maxDistance} km
            </label>
            <Slider
              value={[localFilters.maxDistance]}
              onValueChange={handleDistanceChange}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Show Me */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Mostrarme
            </label>
            <Select
              options={[
                { value: 'men', label: 'Hombres' },
                { value: 'women', label: 'Mujeres' },
                { value: 'everyone', label: 'Todos' }
              ]}
              value={localFilters.showMe}
              onChange={(value) => setLocalFilters(prev => ({ ...prev, showMe: value as any }))}
              className="w-full"
            />
          </div>

          {/* Sexual Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Rol sexual
            </label>
            <Select
              options={[
                { value: 'active', label: 'Activo' },
                { value: 'passive', label: 'Pasivo' },
                { value: 'versatile', label: 'Versátil' },
                { value: 'any', label: 'Cualquiera' }
              ]}
              value={localFilters.sexualRole}
              onChange={(value) => setLocalFilters(prev => ({ ...prev, sexualRole: value as any }))}
              className="w-full"
            />
          </div>

          {/* Quick Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Filtros rápidos
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Solo usuarios en línea</span>
                </div>
                <Switch
                  checked={localFilters.onlineOnly}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, onlineOnly: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Solo usuarios verificados</span>
                </div>
                <Switch
                  checked={localFilters.verifiedOnly}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, verifiedOnly: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Solo usuarios Premium</span>
                </div>
                <Switch
                  checked={localFilters.premiumOnly}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, premiumOnly: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-accent-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Solo con fotos</span>
                </div>
                <Switch
                  checked={localFilters.hasPhotos}
                  onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, hasPhotos: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Intereses ({localFilters.interests.length} seleccionados)
            </h3>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm border transition-colors",
                    localFilters.interests.includes(interest)
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex space-x-3">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="flex-1"
          >
            Restablecer
          </Button>
          <Button
            onClick={handleApplyFilters}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
          >
            Aplicar filtros
          </Button>
        </div>
      </Card>
    </div>
  );
}

export type { FilterOptions };