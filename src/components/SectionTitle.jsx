export default function SectionTitle({ eyebrow, title, text, centered = true }) {
  return (
    <div className={`${centered ? "mx-auto text-center" : ""} max-w-3xl animate-fadeUp`}>
      {eyebrow && <p className="script-line mb-2 text-3xl text-cocoa md:text-4xl">{eyebrow}</p>}
      <h2 className="display-title text-4xl font-semibold leading-tight text-coffee md:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-sm leading-7 text-coffee/75 md:text-base">{text}</p>}
    </div>
  );
}
