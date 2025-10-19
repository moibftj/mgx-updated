import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Crown,
  Bell,
  FileText,
  CreditCard,
  Scale,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "./Logo";
import { cn } from "../lib/utils";

interface HeaderProps {
  userDashboardView?: "dashboard" | "new_letter_form" | "subscription";
  setUserDashboardView?: (
    view: "dashboard" | "new_letter_form" | "subscription",
  ) => void;
  onBackToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userDashboardView,
  setUserDashboardView,
  onBackToLanding,
}) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return Crown;
      case "employee":
        return Briefcase;
      default:
        return User;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "employee":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const navigationItems =
    user && user.role === "user" && setUserDashboardView
      ? [
          {
            id: "dashboard",
            label: "My Letters",
            icon: FileText,
            active: userDashboardView === "dashboard",
            onClick: () => setUserDashboardView("dashboard"),
          },
          {
            id: "subscription",
            label: "Subscription",
            icon: CreditCard,
            active: userDashboardView === "subscription",
            onClick: () => setUserDashboardView("subscription"),
          },
        ]
      : [];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-50 w-full bg-white border-b border-slate-200 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Logo
              size="md"
              showText={true}
              variant="default"
              className="cursor-pointer"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    item.active
                      ? "bg-blue-100 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </motion.button>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </motion.button>
            )}

            {/* User Menu */}
            {user && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-slate-700 truncate max-w-32">
                      {user.email.split("@")[0]}
                    </p>
                    <div
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                        getRoleBadgeColor(user.role),
                      )}
                    >
                      {React.createElement(getRoleIcon(user.role), {
                        className: "w-3 h-3 mr-1",
                      })}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                  </div>
                </motion.button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
                      onMouseLeave={() => setIsMenuOpen(false)}
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-medium text-slate-900 truncate"
                              title={user.email}
                            >
                              {user.email}
                            </p>
                            <div
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1",
                                getRoleBadgeColor(user.role),
                              )}
                            >
                              {React.createElement(getRoleIcon(user.role), {
                                className: "w-3 h-3 mr-1",
                              })}
                              {user.role.charAt(0).toUpperCase() +
                                user.role.slice(1)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <Settings className="w-4 h-4 mr-3 text-slate-400" />
                          Account Settings
                        </button>
                        <button className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <Bell className="w-4 h-4 mr-3 text-slate-400" />
                          Notifications
                        </button>
                      </div>

                      <div className="border-t border-slate-100 py-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-slate-200 py-4"
            >
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        item.onClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors",
                        item.active
                          ? "bg-blue-100 text-blue-700"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                      )}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
