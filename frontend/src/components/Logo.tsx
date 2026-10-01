import logo from '../assets/logo.png';

export default function Logo({ className = 'h-12' }: { className?: string }) {
  return <img src={logo} alt="MAI WADI — As pure as you" className={`${className} w-auto object-contain`} width={263} height={251} />;
}
