import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sun,
  MapPin,
  Calendar,
  Crosshair,
  RefreshCw,
  Info,
  BookmarkCheck,
  PlusCircle,
  Database,
  Check,
  Search,
  Clock,
  ShieldCheck,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { HourlyRadiationResponse } from '../../types';
import { UnifiedSolarObservationRecord, CacheFreshnessStatus } from '../../types/scientificModel';
import { fetchHourlyRadiation } from '../../services/api';
import { mobileDatabase, MobileLocation } from '../../services/indexedDbService';
import { ScientificAuditModal } from './ScientificAuditModal';

export const SolarRadiationChart: React.FC = () => {
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [stations, setStations] = useState<MobileLocation[]>([]);
  const [recentLocations, setRecentLocations] = useState<MobileLocation[]>([]);
  const [selectedStation, setSelectedStation] = useState<MobileLocation | null>(null);

  const [customLat, setCustomLat] = useState<string>('48.836');
  const [customLon, setCustomLon] = useState<string>('2.336');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Omit<MobileLocation, 'id' | 'created_at'>[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // New station modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newStationName, setNewStationName] = useState<string>('');
  const [newStationCountry, setNewStationCountry] = useState<string>('');

  // Save history state
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Today's date by default (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [radiationData, setRadiationData] = useState<HourlyRadiationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Visibility toggles
  const [showGhi, setShowGhi] = useState<boolean>(true);
  const [showDni, setShowDni] = useState<boolean>(true);
  const [showDhi, setShowDhi] = useState<boolean>(true);

  // Load stations & recents from IndexedDB on phone mount
  useEffect(() => {
    mobileDatabase.getLocations().then((loaded) => {
      setStations(loaded);
      if (loaded.length > 0 && !selectedStation) {
        setSelectedStation(loaded[0]);
        setCustomLat(loaded[0].latitude.toString());
        setCustomLon(loaded[0].longitude.toString());
      }
    });
    mobileDatabase.getRecentLocations().then(setRecentLocations);
  }, []);

  // Handle outside click to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search input change handler
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      const results = mobileDatabase.searchCatalog(val);
      setSearchResults(results);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSelectSearchResult = (item: Omit<MobileLocation, 'id' | 'created_at'>) => {
    setCustomLat(item.latitude.toString());
    setCustomLon(item.longitude.toString());
    setIsCustomMode(true);
    setShowSearchDropdown(false);
    setSearchQuery('');

    const tempLoc: MobileLocation = {
      id: `city-${Date.now()}`,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country,
      timezone: item.timezone,
      created_at: new Date().toISOString(),
    };
    setSelectedStation(tempLoc);
    mobileDatabase.recordRecentLocation(tempLoc);
    mobileDatabase.getRecentLocations().then(setRecentLocations);

    loadData(item.latitude, item.longitude, selectedDate, item.name);
  };

  // Load radiation series
  const loadData = async (lat: number, lon: number, dateStr: string, name?: string) => {
    setLoading(true);
    try {
      const data = await fetchHourlyRadiation(lat, lon, dateStr, name);
      setRadiationData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedStation && !isCustomMode) return;
    const lat = isCustomMode ? parseFloat(customLat) || 48.836 : selectedStation?.latitude || 48.836;
    const lon = isCustomMode ? parseFloat(customLon) || 2.336 : selectedStation?.longitude || 2.336;
    const name = isCustomMode ? selectedStation?.name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` : selectedStation?.name;
    loadData(lat, lon, selectedDate, name);
  }, [selectedStation, isCustomMode, selectedDate]);

  const handleStationChange = (station: MobileLocation) => {
    setIsCustomMode(false);
    setSelectedStation(station);
    setCustomLat(station.latitude.toString());
    setCustomLon(station.longitude.toString());
    mobileDatabase.recordRecentLocation(station);
    mobileDatabase.getRecentLocations().then(setRecentLocations);
  };

  const handleApplyCustom = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setIsCustomMode(true);
      const name = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      const tempLoc: MobileLocation = {
        id: `custom-${Date.now()}`,
        name,
        latitude: lat,
        longitude: lon,
        country: 'Coordonnées directes',
        timezone: 'UTC',
        created_at: new Date().toISOString(),
      };
      setSelectedStation(tempLoc);
      mobileDatabase.recordRecentLocation(tempLoc);
      mobileDatabase.getRecentLocations().then(setRecentLocations);
      loadData(lat, lon, selectedDate, name);
    }
  };

  const handleGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(3));
          const lon = parseFloat(pos.coords.longitude.toFixed(3));
          setCustomLat(lat.toString());
          setCustomLon(lon.toString());
          setIsCustomMode(true);
          const name = 'Position locale GPS';
          const tempLoc: MobileLocation = {
            id: `gps-${Date.now()}`,
            name,
            latitude: lat,
            longitude: lon,
            country: 'Capteur GPS',
            timezone: 'UTC',
            created_at: new Date().toISOString(),
          };
          setSelectedStation(tempLoc);
          mobileDatabase.recordRecentLocation(tempLoc);
          mobileDatabase.getRecentLocations().then(setRecentLocations);
          loadData(lat, lon, selectedDate, name);
        },
        () => {
          alert('Impossible d’accéder au capteur GPS de votre appareil.');
        }
      );
    }
  };

  const handleSaveToLocalDB = async () => {
    if (!radiationData) return;
    await mobileDatabase.saveRadiationRecord({
      location_name: radiationData.location_name || `${radiationData.latitude}°, ${radiationData.longitude}°`,
      latitude: radiationData.latitude,
      longitude: radiationData.longitude,
      date: radiationData.date,
      daily_irradiation_kwh: radiationData.daily_irradiation_kwh,
      peak_ghi: radiationData.peak_ghi,
      peak_dni: radiationData.peak_dni,
      sunshine_hours: radiationData.sunshine_hours,
      source: radiationData.source,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveNewStation = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!newStationName.trim() || isNaN(lat) || isNaN(lon)) return;

    const created = await mobileDatabase.addLocation({
      name: newStationName.trim(),
      latitude: lat,
      longitude: lon,
      country: newStationCountry.trim() || 'Locale',
      timezone: 'UTC',
    });

    const updated = await mobileDatabase.getLocations();
    setStations(updated);
    setSelectedStation(created);
    setIsCustomMode(false);
    setShowAddModal(false);
    setNewStationName('');
    setNewStationCountry('');
  };

  // SVG dimensions & scale math
  const width = 860;
  const height = 340;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxIrradiance = useMemo(() => {
    if (!radiationData || !radiationData.hourly.length) return 1000;
    const maxVal = Math.max(
      ...radiationData.hourly.flatMap((p) => [p.ghi, p.dni, p.dhi])
    );
    return Math.max(800, Math.ceil(maxVal / 100) * 100);
  }, [radiationData]);

  const getX = (hourIndex: number) => paddingLeft + (hourIndex / 23) * chartW;
  const getY = (val: number) => paddingTop + chartH - (Math.max(0, val) / maxIrradiance) * chartH;

  const ghiPath = useMemo(() => {
    if (!radiationData) return '';
    return radiationData.hourly.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(p.ghi);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [radiationData, maxIrradiance]);

  const ghiAreaPath = useMemo(() => {
    if (!radiationData) return '';
    const line = ghiPath;
    const xLast = getX(23);
    const xFirst = getX(0);
    const yBottom = paddingTop + chartH;
    return `${line} L ${xLast} ${yBottom} L ${xFirst} ${yBottom} Z`;
  }, [ghiPath]);

  const dniPath = useMemo(() => {
    if (!radiationData) return '';
    return radiationData.hourly.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(p.dni);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [radiationData, maxIrradiance]);

  const dhiPath = useMemo(() => {
    if (!radiationData) return '';
    return radiationData.hourly.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(p.dhi);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [radiationData, maxIrradiance]);

  const hoveredPoint = hoverIndex !== null && radiationData?.hourly ? radiationData.hourly[hoverIndex] : null;

  const maxElevation = useMemo(() => {
    if (!radiationData) return 0;
    return Math.max(...radiationData.hourly.map((p) => p.solar_elevation), 0);
  }, [radiationData]);

  // Provenance / Cache status indicator
  const cacheStatus: CacheFreshnessStatus = radiationData?.cache_status || (radiationData?.cached ? 'cached' : 'fresh');

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-5">
      {/* Header with Title and Mode indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Sun className="w-3.5 h-3.5" />
            <span>MODÈLE SCIENTIFIQUE SOLAIRE UNIFIÉ · PVGIS V0.2 & BASE LOCALE</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Tracé Horaire du Rayonnement Solaire (24h)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Irradiance instantanée (W/m²), irradiation journalière (kWh/m²) et composantes directe (DNI) vs diffuse (DHI)
          </p>
        </div>

        {/* Provenance & Cache Badge */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {radiationData?.source === 'pvgis_jrc_sarah2' && !radiationData?.is_simulated ? (
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-1 rounded flex items-center gap-1.5" title="Données satellitaires réelles PVGIS SARAH-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>PVGIS SARAH-2 (Satellitaire)</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/70 border border-amber-800/60 px-2.5 py-1 rounded flex items-center gap-1.5" title="Modèle théorique ciel clair Spencer & Bird (intégration composite)">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Spencer & Bird (Simulation)</span>
            </span>
          )}

          {cacheStatus === 'fresh' && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded flex items-center gap-1.5" title="Données récupérées en direct">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>En direct</span>
            </span>
          )}
          {cacheStatus === 'cached' && (
            <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2.5 py-1 rounded flex items-center gap-1.5" title="Données chargées depuis le cache local (durée de validité active)">
              <Database className="w-3 h-3 text-sky-400" />
              <span>En cache local</span>
            </span>
          )}
          {(cacheStatus === 'fallback_model' || cacheStatus === 'stale') && (
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-1 rounded flex items-center gap-1.5" title="Calcul astronomique direct sur téléphone (100% hors-ligne)">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Moteur Autonome (Hors-ligne)</span>
            </span>
          )}

          <button
            onClick={() => {
              const lat = isCustomMode ? parseFloat(customLat) || 48.836 : selectedStation?.latitude || 48.836;
              const lon = isCustomMode ? parseFloat(customLon) || 2.336 : selectedStation?.longitude || 2.336;
              loadData(lat, lon, selectedDate);
            }}
            disabled={loading}
            aria-label="Actualiser les données de rayonnement solaire"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Search & Location Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Offline City Search Bar */}
        <div className="lg:col-span-5 relative" ref={searchContainerRef}>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg focus-within:border-amber-500/80 transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher une ville, région ou observatoire..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full placeholder:text-slate-500"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-56 overflow-y-auto">
              {searchResults.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleSelectSearchResult(city)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between border-b border-slate-800/50 last:border-b-0"
                >
                  <div>
                    <span className="font-semibold text-slate-200">{city.name}</span>
                    <span className="text-slate-500 ml-1.5">({city.country})</span>
                  </div>
                  <span className="font-mono text-[11px] text-amber-400/90">
                    {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Selector & Astronomical Solstices */}
        <div className="lg:col-span-7 flex flex-wrap items-center justify-start lg:justify-end gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDate('2026-06-21')}
              className="px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded border border-slate-800"
              title="Solstice d'été (Ensoleillement maximum)"
            >
              Été
            </button>
            <button
              onClick={() => setSelectedDate('2026-09-22')}
              className="px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded border border-slate-800"
              title="Équinoxe d'automne (12h de jour)"
            >
              Équinoxe
            </button>
            <button
              onClick={() => setSelectedDate('2026-12-21')}
              className="px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded border border-slate-800"
              title="Solstice d'hiver (Jour le plus court)"
            >
              Hiver
            </button>

            <button
              onClick={() => setShowAuditModal(true)}
              className="px-2.5 py-1 text-[11px] font-mono text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 rounded border border-amber-500/30 flex items-center gap-1.5 transition-colors"
              title="Consulter la traçabilité scientifique (sources, versions, formules, dates UTC)"
            >
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Traçabilité Scientifique</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Stations Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          Stations :
        </span>
        {stations.map((station) => {
          const isSelected = !isCustomMode && selectedStation?.id === station.id;
          return (
            <button
              key={station.id}
              onClick={() => handleStationChange(station)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                isSelected
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {station.name}
            </button>
          );
        })}
      </div>

      {/* Recent Locations (PWA Mobile History) */}
      {recentLocations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-mono">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Récents :
          </span>
          {recentLocations.slice(0, 5).map((loc) => (
            <button
              key={loc.id}
              onClick={() => {
                setCustomLat(loc.latitude.toString());
                setCustomLon(loc.longitude.toString());
                setIsCustomMode(true);
                setSelectedStation(loc);
                loadData(loc.latitude, loc.longitude, selectedDate, loc.name);
              }}
              className="px-2 py-0.5 rounded text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800/80 transition-colors"
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}

      {/* Manual coordinates bar with Save Station and GPS */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs font-mono text-slate-400">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider">Coordonnées :</span>
        <div className="flex items-center gap-1">
          <label htmlFor="input-lat" className="text-slate-500 text-[11px]">Lat</label>
          <input
            id="input-lat"
            type="number"
            step="0.01"
            value={customLat}
            onChange={(e) => setCustomLat(e.target.value)}
            className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs text-center focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <label htmlFor="input-lon" className="text-slate-500 text-[11px]">Lon</label>
          <input
            id="input-lon"
            type="number"
            step="0.01"
            value={customLon}
            onChange={(e) => setCustomLon(e.target.value)}
            className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs text-center focus:border-amber-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleApplyCustom}
          className="px-2.5 py-0.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
        >
          Calculer
        </button>
        <button
          onClick={handleGeolocation}
          className="px-2.5 py-0.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-950/80 border border-amber-800/40 rounded transition-colors flex items-center gap-1"
        >
          <Crosshair className="w-3 h-3" />
          GPS
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="ml-auto px-2.5 py-0.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-950/80 border border-sky-800/40 rounded transition-colors flex items-center gap-1"
        >
          <PlusCircle className="w-3 h-3" />
          Enregistrer station
        </button>

        <button
          onClick={handleSaveToLocalDB}
          disabled={!radiationData || savedSuccess}
          className="px-2.5 py-0.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-800/40 rounded transition-colors flex items-center gap-1"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              Enregistré !
            </>
          ) : (
            <>
              <BookmarkCheck className="w-3 h-3" />
              Sauvegarder calcul
            </>
          )}
        </button>
      </div>

      {/* Modal to add custom station */}
      {showAddModal && (
        <div className="p-4 bg-slate-950 border border-slate-700 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-200">
              Enregistrer cette station dans la base locale IndexedDB
            </span>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Annuler
            </button>
          </div>
          <form onSubmit={handleSaveNewStation} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              placeholder="Nom de la station (ex: Toit Solaire, Ma Maison)"
              value={newStationName}
              onChange={(e) => setNewStationName(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="Pays / Région (ex: France)"
              value={newStationCountry}
              onChange={(e) => setNewStationCountry(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded text-xs transition-colors"
            >
              Confirmer ({customLat}°, {customLon}°)
            </button>
          </form>
        </div>
      )}

      {/* Simulation / Physical Model Transparency Banner */}
      {radiationData?.is_simulated && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>Simulation par Modèle Astronomique Local (Hors-Ligne)</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-900/60 border border-amber-700/60 rounded text-amber-300">
                Non Mesuré
              </span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
              {radiationData.warning ||
                'Ces valeurs sont calculées localement par algorithme astronomique (Spencer & Bird) sur le processeur du smartphone. Elles ne proviennent pas d’observations satellitaires réelles PVGIS JRC.'}
            </p>
          </div>
        </div>
      )}

      {/* KPI Ribbon: High-precision scientific metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Irradiation Journalière
          </div>
          <div className="mt-1 text-2xl font-mono font-bold text-slate-100 tabular-nums">
            {radiationData?.daily_irradiation_kwh ?? '—'}
            <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">kWh/m²</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Énergie totale ({radiationData?.daily_irradiation_kwh ? (radiationData.daily_irradiation_kwh * 1000).toLocaleString() : '—'} Wh/m²)
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90">
            Pic d'Irradiance (GHI)
          </div>
          <div className="mt-1 text-2xl font-mono font-bold text-amber-300 tabular-nums">
            {radiationData?.peak_ghi ?? '—'}
            <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">W/m²</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Puissance surfacique max</div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-orange-400/90">
            Insolation OMM (DNI)
          </div>
          <div className="mt-1 text-2xl font-mono font-bold text-orange-300 tabular-nums">
            {radiationData?.sunshine_hours ?? '—'}
            <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">h</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Seuil OMM: DNI ≥ 120 W/m²</div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
            Hauteur Solaire Max
          </div>
          <div className="mt-1 text-2xl font-mono font-bold text-sky-300 tabular-nums">
            {maxElevation.toFixed(1)}
            <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">°</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Élévation au midi solaire</div>
        </div>
      </div>

      {/* Interactive SVG Chart Viewport */}
      <div className="relative border border-slate-800 rounded-xl bg-slate-950 p-3 overflow-hidden">
        {/* Layer Visibility Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-2 text-xs font-mono">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowGhi(!showGhi)}
              className={`flex items-center gap-1.5 transition-opacity ${
                showGhi ? 'opacity-100 font-semibold text-amber-400' : 'opacity-40 text-slate-500'
              }`}
            >
              <span className="w-3 h-1 bg-amber-400 rounded-full" />
              <span>GHI (Global)</span>
            </button>

            <button
              onClick={() => setShowDni(!showDni)}
              className={`flex items-center gap-1.5 transition-opacity ${
                showDni ? 'opacity-100 font-semibold text-orange-400' : 'opacity-40 text-slate-500'
              }`}
            >
              <span className="w-3 h-1 bg-orange-400 rounded-full" />
              <span>DNI (Direct)</span>
            </button>

            <button
              onClick={() => setShowDhi(!showDhi)}
              className={`flex items-center gap-1.5 transition-opacity ${
                showDhi ? 'opacity-100 font-semibold text-sky-400' : 'opacity-40 text-slate-500'
              }`}
            >
              <span className="w-3 h-1 bg-sky-400 rounded-full" />
              <span>DHI (Diffus)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Unités : <strong>W/m²</strong> (Irradiance) · Heures UTC
          </div>
        </div>

        {/* SVG Curve */}
        <div className="relative w-full overflow-x-auto touch-pan-x">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="ghiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                <stop offset="90%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines horizontal */}
            {[0, 200, 400, 600, 800, 1000].map((level) => {
              if (level > maxIrradiance) return null;
              const y = getY(level);
              return (
                <g key={level}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray={level === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {level}
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines (every 3 hours) */}
            {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((hour) => {
              const x = getX(hour);
              return (
                <g key={hour}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartH}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={x}
                    y={paddingTop + chartH + 18}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </text>
                </g>
              );
            })}

            {/* GHI area fill */}
            {showGhi && ghiAreaPath && (
              <path d={ghiAreaPath} fill="url(#ghiGradient)" />
            )}

            {/* GHI curve line */}
            {showGhi && ghiPath && (
              <path
                d={ghiPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* DNI curve line */}
            {showDni && dniPath && (
              <path
                d={dniPath}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeDasharray="4 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* DHI curve line */}
            {showDhi && dhiPath && (
              <path
                d={dhiPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive hover line & points */}
            {hoverIndex !== null && hoveredPoint && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={paddingTop}
                  x2={getX(hoverIndex)}
                  y2={paddingTop + chartH}
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                {showGhi && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(hoveredPoint.ghi)}
                    r="4"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
                {showDni && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(hoveredPoint.dni)}
                    r="4"
                    fill="#f97316"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
                {showDhi && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(hoveredPoint.dhi)}
                    r="4"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            )}

            {/* Invisible interactive hover columns */}
            {radiationData?.hourly.map((_, i) => {
              const xLeft = i === 0 ? paddingLeft : getX(i) - chartW / 46;
              const colW = chartW / 23;
              return (
                <rect
                  key={i}
                  x={xLeft}
                  y={paddingTop}
                  width={colW}
                  height={chartH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(i)}
                  onTouchStart={() => setHoverIndex(i)}
                  onTouchMove={(e) => {
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (!rect) return;
                    const touchX = e.touches[0].clientX - rect.left;
                    const approxIdx = Math.max(0, Math.min(23, Math.round(((touchX - paddingLeft) / chartW) * 23)));
                    setHoverIndex(approxIdx);
                  }}
                />
              );
            })}
          </svg>
        </div>

        {/* Hover Floating HUD Tooltip */}
        {hoveredPoint && (
          <div className="mt-3 p-3 bg-slate-900 border border-slate-700/80 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-200 animate-in fade-in duration-100">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">
                {hoveredPoint.hour.toString().padStart(2, '0')}:00 UTC
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                Hauteur : <strong className="text-slate-100">{hoveredPoint.solar_elevation}°</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                GHI: <strong className="text-amber-300 tabular-nums">{hoveredPoint.ghi} W/m²</strong>
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                DNI: <strong className="text-orange-300 tabular-nums">{hoveredPoint.dni} W/m²</strong>
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                DHI: <strong className="text-sky-300 tabular-nums">{hoveredPoint.dhi} W/m²</strong>
              </span>

              {hoveredPoint.temperature !== undefined && hoveredPoint.temperature !== null ? (
                <span className="text-slate-400" title="Température de l’air à 2m (T2m) issue de la réanalyse météorologique ERA5 / PVGIS">
                  T2m météo : <strong className="text-slate-200 tabular-nums">{hoveredPoint.temperature}°C</strong>
                  <span className="text-[10px] text-emerald-400/90 ml-1 font-sans">(ERA5)</span>
                </span>
              ) : hoveredPoint.ambient_temperature_proxy_c !== undefined ? (
                <span className="text-slate-400" title="Proxy physique indicatif théorique (non issu d’une station ou prévision météo)">
                  T° proxy : <strong className="text-slate-200 tabular-nums">{hoveredPoint.ambient_temperature_proxy_c}°C</strong>
                  <span className="text-[10px] text-amber-400/80 ml-1 font-sans">(proxy indicatif, non météo)</span>
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Scientific Notes & Physical Balance */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            Loi physique : <strong className="text-slate-300 font-normal">GHI = DNI · sin(hauteur solaire) + DHI</strong>
          </span>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            Constante solaire : <strong className="text-slate-300 font-normal">I_sc = 1361.2 W/m²</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">
            Source : {radiationData?.product_name || 'PVGIS-SARAH2 / JRC'}
          </span>
          <button
            onClick={() => setShowAuditModal(true)}
            className="text-amber-400 hover:text-amber-300 underline font-medium transition-colors"
          >
            (Fiche de Traçabilité)
          </button>
        </div>
      </div>

      {/* Scientific Provenance & Audit Modal */}
      <ScientificAuditModal
        data={radiationData}
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
};
