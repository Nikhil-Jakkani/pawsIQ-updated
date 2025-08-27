import React from 'react';
import { FaPaw, FaDog, FaCat, FaFish, FaFeather, FaHorse, FaKiwiBird, FaMouse } from 'react-icons/fa';
import { GiRabbit, GiTurtle } from 'react-icons/gi';

export const PetIcon = ({ type = 'paw', size = 'md', className = '' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
  }[size] || 'w-5 h-5';

  const getIcon = () => {
    switch (type?.toLowerCase()) {
      case 'dog':
        return <FaDog className={`${sizeClass} ${className}`} />;
      case 'cat':
        return <FaCat className={`${sizeClass} ${className}`} />;
      case 'fish':
        return <FaFish className={`${sizeClass} ${className}`} />;
      case 'bird':
        return <FaKiwiBird className={`${sizeClass} ${className}`} />;
      case 'rabbit':
        return <GiRabbit className={`${sizeClass} ${className}`} />;
      case 'hamster':
        return <FaMouse className={`${sizeClass} ${className}`} />;
      case 'turtle':
        return <GiTurtle className={`${sizeClass} ${className}`} />;
      case 'horse':
        return <FaHorse className={`${sizeClass} ${className}`} />;
      case 'feather':
        return <FaFeather className={`${sizeClass} ${className}`} />;
      default:
        return <FaPaw className={`${sizeClass} ${className}`} />;
    }
  };

  return getIcon();
};

export const PetIconButton = ({ type, onClick, label, variant = 'primary', size = 'md', className = '' }) => {
  const variants = {
    primary: 'text-white',
    secondary: 'bg-white text-white hover:bg-blue-50',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white',
  };

  const sizes = {
    sm: 'text-xs px-2 py-1 rounded',
    md: 'text-sm px-3 py-2 rounded-md',
    lg: 'text-base px-4 py-2 rounded-md',
    xl: 'text-lg px-5 py-3 rounded-lg',
  };

  const getButtonStyle = () => {
    if (variant === 'primary') {
      return { backgroundColor: '#145ae6' };
    }
    if (variant === 'secondary') {
      return { border: `1px solid #145ae6`, color: '#145ae6' };
    }
    return {};
  };

  const handleMouseEnter = (e) => {
    if (variant === 'primary') {
      e.target.style.backgroundColor = '#0f4bc7';
    }
  };

  const handleMouseLeave = (e) => {
    if (variant === 'primary') {
      e.target.style.backgroundColor = '#145ae6';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      style={getButtonStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <PetIcon type={type} size={size} />
      {label && <span>{label}</span>}
    </button>
  );
};

export const PetBadge = ({ type, label, variant = 'primary', size = 'sm' }) => {
  const variants = {
    primary: 'bg-blue-100',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizes = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const getBadgeStyle = () => {
    if (variant === 'primary') {
      return { color: '#145ae6' };
    }
    return {};
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]}`}
      style={getBadgeStyle()}
    >
      <PetIcon type={type} size="sm" />
      {label}
    </span>
  );
};

export default { PetIcon, PetIconButton, PetBadge };