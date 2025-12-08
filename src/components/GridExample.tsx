/**
 * Example: How to use Cal.com-style grid system
 * This is a reference component - you can copy patterns from here
 */

export function GridExample() {
  return (
    <>
      {/* Example 1: Simple 3-column grid */}
      <section className="cal-section bg-white">
        <div className="cal-container">
          <h2 className="text-2xl font-bold mb-8 text-center">Grid Example</h2>
          
          <div className="cal-grid">
            <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-2">Column 1</h3>
                <p className="text-sm text-gray-600">Full width on mobile, half on tablet, third on desktop</p>
              </div>
            </div>
            
            <div className="cal-col-span-12 sm:cal-col-span-6 lg:cal-col-span-4">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-2">Column 2</h3>
                <p className="text-sm text-gray-600">Responsive grid spacing</p>
              </div>
            </div>
            
            <div className="cal-col-span-12 lg:cal-col-span-4">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-2">Column 3</h3>
                <p className="text-sm text-gray-600">12-column system working!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example 2: Asymmetric layout */}
      <section className="cal-section bg-gray-50">
        <div className="cal-container">
          <div className="cal-grid">
            <div className="cal-col-span-12 lg:cal-col-span-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Main Content (8 cols)</h3>
                <p className="text-gray-600">This takes up 8 columns on desktop, full width on mobile.</p>
              </div>
            </div>
            
            <div className="cal-col-span-12 lg:cal-col-span-4">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Sidebar (4 cols)</h3>
                <p className="text-gray-600">This takes up 4 columns on desktop, full width on mobile.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

