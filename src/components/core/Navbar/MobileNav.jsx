import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsChevronDown } from "react-icons/bs";
import { AiOutlineMenu } from "react-icons/ai";
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const MobileNav = ({ NavbarLinks, matchRoute, subLinks, loading, user, totalItems }) => {
  const { token } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  return (
    <div className="md:hidden relative z-[1000]">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-richblack-900 bg-opacity-50 z-[998]"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed right-0 top-14 w-full bg-richblack-900 z-[999] max-h-[calc(100vh-3.5rem)] overflow-y-auto"
            >
              <nav className="flex flex-col w-full">
                {token === null && (
                  <>
                    <Link
                      to="/login"
                      className="block p-4 text-richblack-25 border-b border-richblack-700 hover:bg-richblack-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="block p-4 text-richblack-25 border-b border-richblack-700 hover:bg-richblack-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
                {NavbarLinks.map((link, index) => (
                  <div key={index} className="border-b border-richblack-700 last:border-none">
                    {link.title === "Catalog" ? (
                      <div>
                        <button
                          onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                          className="flex items-center justify-between w-full p-4 text-richblack-25"
                        >
                          <span>{link.title}</span>
                          <BsChevronDown className={`transform transition-transform ${isCatalogOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {isCatalogOpen && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden bg-richblack-800"
                            >
                              {loading ? (
                                <p className="p-4 text-center text-richblack-25">Loading...</p>
                              ) : subLinks.length ? (
                                subLinks.map((subLink, i) => (
                                  <Link
                                    key={i}
                                    to={`/catalog/${subLink.name.split(" ").join("-").toLowerCase()}`}
                                    className="block p-4 text-richblack-25 hover:bg-richblack-700"
                                    onClick={() => {
                                      setIsOpen(false);
                                      setIsCatalogOpen(false);
                                    }}
                                  >
                                    {subLink.name}
                                  </Link>
                                ))
                              ) : (
                                <p className="p-4 text-center text-richblack-25">No Courses Found</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        to={link.path}
                        className={`block p-4 ${
                          matchRoute(link.path) ? "text-yellow-25" : "text-richblack-25"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {link.title}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-richblack-700 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        <AiOutlineMenu fontSize={24} className="text-richblack-25" />
      </button>
    </div>
  );
};

export default MobileNav;