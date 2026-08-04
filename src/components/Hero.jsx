import SearchBox from './SearchBox'

export default function Hero({ value, onChange, onSubmit }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Tech, understood</p>
        <h1>
          Find tech that fits
          <br />
          <em>your life.</em>
        </h1>
        <p>Describe what you need. SmartRec searches live India listings and a built-in catalog.</p>
      </div>
      <SearchBox value={value} onChange={onChange} onSubmit={onSubmit} />
    </section>
  )
}
