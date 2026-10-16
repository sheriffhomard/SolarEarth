import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ComingSoonCard } from '../components/common/ComingSoonCard';
import { SolarRadiationChart } from '../components/solar/SolarRadiationChart';
import { Sun } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { MobileNav } from '../components/layout/MobileNav';

describe('Solar Earth — Frontend Tests (V0.2 PVGIS Integration)', () => {
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

  it('3. Renders SolarRadiationChart with 24h curve, GHI/DNI/DHI controls and KPIs', async () => {
    render(<SolarRadiationChart />);

    // Check header
    expect(screen.getByText(/Tracé Horaire du Rayonnement Solaire/i)).toBeInTheDocument();

    // Check station presets
    expect(screen.getByText('Observatoire de Paris')).toBeInTheDocument();
    expect(screen.getByText('Carpentras (Provence)')).toBeInTheDocument();

    // Check GHI, DNI, DHI toggles
    expect(screen.getByText(/GHI \(Global\)/i)).toBeInTheDocument();
    expect(screen.getByText(/DNI \(Direct\)/i)).toBeInTheDocument();
    expect(screen.getByText(/DHI \(Diffus\)/i)).toBeInTheDocument();
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
});
