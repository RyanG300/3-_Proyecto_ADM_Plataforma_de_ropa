import { useState } from 'react'

export default function RatingStars({
  rating = 0,
  onRatingChange = null,
  size = 'h-5 w-5',
  maxStars = 5,
  disabled = false,
}) {
  const [hoverRating, setHoverRating] = useState(0)
  const isInteractive = typeof onRatingChange === 'function' && !disabled

  const handleMouseEnter = (index) => {
    if (isInteractive) setHoverRating(index)
  }

  const handleMouseLeave = () => {
    if (isInteractive) setHoverRating(0)
  }

  const handleClick = (index) => {
    if (isInteractive) onRatingChange(index)
  }

  const displayedRating = hoverRating > 0 ? hoverRating : rating

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, index) => {
        const starIndex = index + 1
        const isFilled = starIndex <= displayedRating

        return (
          <button
            key={starIndex}
            type="button"
            disabled={!isInteractive}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onMouseLeave={handleMouseLeave}
            className={`transition ${isInteractive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            aria-label={`Calificar con ${starIndex} estrellas`}
          >
            <svg
              className={`${size} ${isFilled ? 'text-amber-500 fill-amber-500' : 'text-amber-200 fill-amber-100'}`}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499c.15-.36.6-.36.75 0l2.25 5.385 5.864.444c.4.03.56.52.27.78l-4.5 3.94 1.455 5.676c.1.39-.33.7-.68.49L12 17.25l-5.009 2.977c-.35.21-.78-.1-.68-.49L7.765 14.05 3.265 10.11c-.29-.26-.13-.75.27-.78l5.864-.444 2.25-5.385z"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
