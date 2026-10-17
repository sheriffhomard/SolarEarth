import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ComingSoonCard } from '../components/common/ComingSoonCard';
import { SolarRadiationChart } from '../components/solar/SolarRadiationChart';
import { Sun } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { MobileNav } from '../components/layout/MobileNav';
import { mobileDatabase } from '../services/indexedDbService';
import { scientificCache } from '../services/cachePolicy';

describe('Solar Earth — Frontend Tests (V0.2 PVGIS Integration & Priorities)', () => {
  it('1. Loads Dashboard with Solar Earth title, Solar Radiation chart, and roadmap modules', async () => {
    render(<App />);

    // Check main title
    const headings = screen.getAllByText('SOLAR EARTH');
    expect(headings.length).toBeGreaterThan(0);

    // Check headings
    expect(screen.getByRole('heading', { name: 'Solar Radiation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Solar Activity' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Geomagnetic Activity' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'World Map' })).toBeInTheDocument();

    // Check other Coming soon indicators for V0.4 and V0.6
    const comingSoonElements = screen.getAllByText(/Coming soon/i);
    expect(comingSoonElements.length).toBeGreaterThanOrEqual(3);
  });

  it('2. Navigates between routes using sidebar links', () => {
    render(<App />);

    // Click on World Map in desktop navigation
    const mapNavLinks = screen.getAllByText('World Map');
    fireEvent.click(mapNavLinks[0]);

    // Verify map page content
    expect(screen.getByText(/World Map — Carte Mondiale/i)).toBeInTheDocument();
  });

  it('3. Renders SolarRadiationChart with 24h curve, GHI/DNI/DHI controls, search and KPIs', async () => {
    render(<SolarRadiationChart />);

    // Check header
    expect(screen.getByText(/Tracé Horaire du Rayonnement Solaire/i)).toBeInTheDocument();

    // Check station presets (loaded asynchronously from local IndexedDB)
    expect(await screen.findByText('Observatoire de Paris')).toBeInTheDocument();
    expect(await screen.findByText(/Carpentras/i)).toBeInTheDocument();

    // Check GHI, DNI, DHI toggles
    expect(screen.getByText(/GHI \(Global\)/i)).toBeInTheDocument();
    expect(screen.getByText(/DNI \(Direct\)/i)).toBeInTheDocument();
    expect(screen.getByText(/DHI \(Diffus\)/i)).toBeInTheDocument();

    // Check offline city search input
    const searchInput = screen.getByPlaceholderText(/Rechercher une ville/i);
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'Marseille' } });
    expect(await screen.findByText(/Marseille \(Vieux-Port\)/i)).toBeInTheDocument();
  });

  it('4. Renders ComingSoonCard with scientific metadata and units without fake data', () => {
    render(
      <ComingSoonCard
        title="Direct Normal Irradiance"
        subtitle="DNI Solar Component"
        targetVersion="V0.4"
        icon={Sun}
        parameters={['DNI Direct', 'Zenith angle']}
        unit="W/m²"
        source="NOAA SWPC"
        description="Mesure du flux solaire direct normal."
      />
    );

    expect(screen.getByText('Direct Normal Irradiance')).toBeInTheDocument();
    expect(screen.getByText('W/m²')).toBeInTheDocument();
    expect(screen.getByText('NOAA SWPC')).toBeInTheDocument();
    expect(screen.getByText('Prévu pour V0.4')).toBeInTheDocument();
  });

  it('5. Toggles and displays mobile menu navigation properly', () => {
    let toggled = false;
    const { rerender } = render(
      <MemoryRouter>
        <Navbar
          onToggleMobileMenu={() => { toggled = true; }}
          isMobileMenuOpen={false}
          serviceStatus="ok"
        />
        <MobileNav isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByLabelText(/Ouvrir le menu/i);
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(toggled).toBe(true);

    // Rerender with open menu
    rerender(
      <MemoryRouter>
        <Navbar
          onToggleMobileMenu={() => {}}
          isMobileMenuOpen={true}
          serviceStatus="ok"
        />
        <MobileNav isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Navigation Solar Earth')).toBeInTheDocument();
  });

  it('6. Tests IndexedDB Local Database & Recent Locations (Priorité 1 & 5)', async () => {
    const defaultStations = await mobileDatabase.getLocations();
    expect(defaultStations.length).toBeGreaterThanOrEqual(4);

    // Add a custom station
    const newLoc = await mobileDatabase.addLocation({
      name: 'Station Test Solaire',
      latitude: 45.188,
      longitude: 5.724,
      country: 'France',
      timezone: 'Europe/Paris',
    });
    expect(newLoc.id).toBeDefined();

    // Verify recent locations recording
    await mobileDatabase.recordRecentLocation(newLoc);
    const recents = await mobileDatabase.getRecentLocations();
    expect(recents.some((r) => r.name === 'Station Test Solaire')).toBe(true);
  });

  it('7. Tests Controlled Cache Expiration & Provenance (Priorité 4)', () => {
    const testKey = 'test_pvgis_carpentras';
    scientificCache.set(testKey, { sample: 42 }, 'pvgis_jrc', 1000); // 1 second TTL

    // Immediately cached
    const resFresh = scientificCache.get<{ sample: number }>(testKey);
    expect(resFresh).not.toBeNull();
    expect(resFresh?.status).toBe('cached');
    expect(resFresh?.isStale).toBe(false);
  });
});
