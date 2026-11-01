/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			// Lab Spec design tokens
  			paper: '#F4F4F0',
  			surface: '#FFFFFF',
  			ink: {
  				DEFAULT: '#0E1013',
  				body: '#33383F',
  				muted: '#4B5159',
  				subtle: '#6B7178'
  			},
  			line: {
  				DEFAULT: '#DCDDD6',
  				soft: '#ECEDE8',
  				strong: '#B9BBB2'
  			},
  			signal: {
  				DEFAULT: '#FF5A1F',
  				text: '#C2410C',
  				hover: '#9A3412',
  				light: '#FF7A45',
  				tint: '#FFE9DF'
  			},
  			night: {
  				DEFAULT: '#0E1013',
  				raised: '#16191E',
  				hover: '#1F2329',
  				line: '#2A2E35',
  				'line-strong': '#3A3F47',
  				text: '#E9EAE6',
  				soft: '#C4C8CE',
  				muted: '#9AA0A8'
  			},
  			neutral: '#1e293b',
  			success: '#10b981',
  			warning: '#f59e0b',
  			error: '#ef4444',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
  			display: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
  			body: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
  			heading: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
  			// Legacy families from the old theme, mapped onto the new type scale
  			orbitron: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
  			neuropol: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
  			ethnocentric: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
  		},
  		backgroundImage: {
  			'gradient-primary': 'linear-gradient(45deg, #1a365d, #2563eb)',
  			'gradient-secondary': 'linear-gradient(45deg, #2563eb, #1a365d)',
  			'gradient-accent': 'linear-gradient(45deg, #3b82f6, #7dd3fc)'
  		},
  		keyframes: {
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-20px)'
  				}
  			},
  			gradient: {
  				'0%, 100%': {
  					backgroundPosition: '0% 50%'
  				},
  				'50%': {
  					backgroundPosition: '100% 50%'
  				}
  			}
  		},
  		animation: {
  			float: 'float 6s ease-in-out infinite',
  			gradient: 'gradient 8s ease infinite'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
