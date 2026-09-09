import React, { useState } from 'react';
import { TravelAdviceRequest } from '../types/travel';

interface TravelFormProps {
  onSubmit: (request: TravelAdviceRequest) => void;
  isLoading: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const TravelForm: React.FC<TravelFormProps> = ({ onSubmit, isLoading }) => {
  const [destination, setDestination] = useState('Dubai');
  const [month, setMonth] = useState('April');
  const [year, setYear] = useState(2027);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [durationDays, setDurationDays] = useState(7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      destination,
      month,
      year: Number(year),
      travelers: { adults: Number(adults), children: Number(children) },
      durationDays: Number(durationDays)
    });
  };

  return (
    <form className="card form-container" onSubmit={handleSubmit}>
      <h2>Plan your journey</h2>
      <p className="form-intro">Tell us the destination, travel window, and who is going.</p>

      <div className="form-grid">
        <div className="form-group wide">
          <label htmlFor="destination">Destination</label>
          <input
            id="destination"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="City or region"
            autoComplete="off"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="month">Month</label>
          <select id="month" value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="year">Year</label>
          <input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2026}
            max={2030}
            required
          />
        </div>
      </div>

      <div className="form-grid traveler-grid">
        <div className="form-group">
          <label htmlFor="adults">Adults</label>
          <input
            id="adults"
            type="number"
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            min={1}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="children">Children</label>
          <input
            id="children"
            type="number"
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            min={0}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="durationDays">Duration (days)</label>
          <input
            id="durationDays"
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            min={1}
            max={30}
            required
          />
        </div>
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary">
        {isLoading && <span className="spinner" aria-hidden="true" />}
        {isLoading ? 'Generating briefing...' : 'Plan my trip'}
      </button>
    </form>
  );
};
