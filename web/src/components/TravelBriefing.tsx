import React from 'react';
import { TravelAdvice } from '../types/travel';

interface TravelBriefingProps {
  advice: TravelAdvice;
}

const money = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString() : '—';

export const TravelBriefing: React.FC<TravelBriefingProps> = ({ advice }) => {
  const weather = advice.weather;
  const flights = advice.flights;
  const hotels = advice.hotels;
  const budget = advice.budget;

  return (
    <div className="briefing-container">
      <header className="briefing-header card">
        <p className="eyebrow">Travel briefing</p>
        <h2>{advice.destination} — {advice.period}</h2>
        <p className="subtitle">{advice.summary}</p>
      </header>

      <div className="grid-2">
        <section className="card">
          <p className="eyebrow">Climate</p>
          <h3 className="section-title">Weather</h3>
          <div className="stat-row">
            <div className="stat-pill">
              <strong>{weather?.averageHighC ?? '—'}°C</strong>
              <span>Average high</span>
            </div>
            <div className="stat-pill">
              <strong>{weather?.averageLowC ?? '—'}°C</strong>
              <span>Average low</span>
            </div>
          </div>
          <p><strong>Rainfall:</strong> {weather?.rainfall ?? '—'}</p>
          <p>{weather?.description}</p>
        </section>

        <section className="card">
          <p className="eyebrow">Getting there</p>
          <h3 className="section-title">Flights</h3>
          <p className="price-tag">
            {flights?.currency} {money(flights?.estimatedRoundTripPrice?.min)} – {money(flights?.estimatedRoundTripPrice?.max)}
          </p>
          {flights?.note && <p className="disclaimer">{flights.note}</p>}
        </section>
      </div>

      <section className="card">
        <p className="eyebrow">Stay</p>
        <h3 className="section-title">Hotels & accommodation</h3>
        {hotels?.note && <p className="disclaimer">{hotels.note}</p>}
        <div className="grid-3 hotel-tiers">
          <div className="price-box">
            <span>Budget</span>
            <strong>{hotels?.currency} {money(hotels?.pricePerNight?.budget)} / night</strong>
          </div>
          <div className="price-box">
            <span>Mid-range</span>
            <strong>{hotels?.currency} {money(hotels?.pricePerNight?.midRange)} / night</strong>
          </div>
          <div className="price-box">
            <span>Luxury</span>
            <strong>{hotels?.currency} {money(hotels?.pricePerNight?.luxury)} / night</strong>
          </div>
        </div>
        <h4>Recommended neighborhoods</h4>
        <div className="area-row">
          {(hotels?.recommendedAreas ?? []).map((area) => (
            <span className="area-chip" key={area}>{area}</span>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <p className="eyebrow">See</p>
          <h3 className="section-title">Places to visit</h3>
          <ul className="place-list">
            {(advice.placesToVisit ?? []).map((place) => (
              <li className="place-card" key={place.name}>
                <div className="place-head">
                  <strong>{place.name}</strong>
                  <em>{place.category}</em>
                  {place.familyFriendly && <span className="badge">Family friendly</span>}
                </div>
                <p>{place.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <p className="eyebrow">Eat & do</p>
          <h3 className="section-title">Local food</h3>
          <div className="chip-row">
            {(advice.food ?? []).map((dish) => (
              <span className="chip" key={dish}>{dish}</span>
            ))}
          </div>
          <h3 className="section-title stacked">Activities</h3>
          <ul>
            {(advice.activities ?? []).map((act) => (
              <li key={act}>{act}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <p className="eyebrow">Day by day</p>
        <h3 className="section-title">Suggested itinerary</h3>
        <div className="itinerary-timeline">
          {(advice.itinerary ?? []).map((dayItem) => (
            <div key={dayItem.day} className="itinerary-day">
              <div className="day-index">D{dayItem.day}</div>
              <div>
                <h4>{dayItem.title}</h4>
                <ul>
                  {(dayItem.activities ?? []).map((act) => (
                    <li key={act}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <p className="eyebrow">Spend</p>
          <h3 className="section-title">Approximate budget</h3>
          <p className="price-tag">
            {budget?.estimatedTotalCurrency} {money(budget?.lowEstimate)} – {money(budget?.highEstimate)}
          </p>
          <p>{budget?.breakdownNote}</p>
        </section>

        <section className="card">
          <p className="eyebrow">Notes</p>
          <h3 className="section-title">Tips</h3>
          <ul>
            {(advice.tips ?? []).map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <h4 className="stacked">Sources</h4>
          <ul>
            {(advice.sources ?? []).map((src) => (
              <li key={src}>{src}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
