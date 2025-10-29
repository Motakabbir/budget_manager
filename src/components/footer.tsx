import { Heart, Github, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
            <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 max-w-7xl">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
                    {/* About Section */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Budget Manager
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Take control of your finances with our comprehensive budget management solution.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="/dashboard" className="hover:text-foreground transition-colors">
                                    Dashboard
                                </a>
                            </li>
                            <li>
                                <a href="/categories" className="hover:text-foreground transition-colors">
                                    Categories
                                </a>
                            </li>
                            <li>
                                <a href="/settings" className="hover:text-foreground transition-colors">
                                    Settings
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">Resources</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a
                                    href="https://github.com/Motakabbir/budget_manager"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                                >
                                    Documentation
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/Motakabbir/budget_manager/issues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                                >
                                    Support
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/Motakabbir/budget_manager"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                                >
                                    GitHub
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Connect */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">Connect</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                asChild
                            >
                                <a
                                    href="https://github.com/Motakabbir"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="GitHub"
                                >
                                    <Github className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                asChild
                            >
                                <a
                                    href="mailto:support@budgetmanager.com"
                                    aria-label="Email"
                                >
                                    <Mail className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator className="my-6" />

                {/* Bottom Bar */}
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    {/* Copyright & Credits */}
                    <div className="text-center md:text-left">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} Budget Manager. All rights reserved.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1 flex-wrap justify-center md:justify-start">
                            Developed with
                            <Heart className="h-3 w-3 text-red-500 fill-red-500 inline animate-pulse" />
                            by
                            <a
                                href="https://github.com/Motakabbir"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                                Motakabbir
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </p>
                    </div>

                    {/* Tech Stack Badge */}
                    <div className="text-xs text-muted-foreground text-center md:text-right">
                        <p>Built with React, TypeScript & Supabase</p>
                        <p className="mt-1">Version 1.0.0</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
