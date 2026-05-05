import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import './index.css'

function Pagination({ current, size, total, onChange }) {
  const totalPages = Math.ceil(total / size)

  if (totalPages <= 1) return null

  const pages = []
  const showPages = 5
  let startPage = Math.max(1, current - Math.floor(showPages / 2))
  let endPage = Math.min(totalPages, startPage + showPages - 1)

  if (endPage - startPage < showPages - 1) {
    startPage = Math.max(1, endPage - showPages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== current) {
      onChange(page)
    }
  }

  return (
    <div className="pagination">
      {/* Previous Page */}
      <button
        className={`pagination-btn ${current === 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(current - 1)}
        disabled={current === 1}
      >
        <FontAwesomeIcon icon={faAngleLeft} />
      </button>

      {/* First Page */}
      {startPage > 1 && (
        <>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(1)}
          >
            1
          </button>
          {startPage > 2 && <span className="pagination-ellipsis">...</span>}
        </>
      )}

      {/* Page Numbers */}
      {pages.map(page => (
        <button
          key={page}
          className={`pagination-btn ${page === current ? 'active' : ''}`}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </button>
      ))}

      {/* Last Page */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Page */}
      <button
        className={`pagination-btn ${current === totalPages ? 'disabled' : ''}`}
        onClick={() => handlePageChange(current + 1)}
        disabled={current === totalPages}
      >
        <FontAwesomeIcon icon={faAngleRight} />
      </button>
    </div>
  )
}

export default Pagination