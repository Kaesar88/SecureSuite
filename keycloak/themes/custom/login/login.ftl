<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=social.displayInfo; section>
    <#if section = "header">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&display=swap');
            
            .iam-login-container {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-color: #f9fafb;
                font-family: 'Courier Prime', monospace;
            }
            
            .iam-login-card {
                background-color: #ffffff;
                border: 1px solid #d1d5db;
                border-radius: 12px;
                padding: 40px 32px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                max-width: 400px;
                width: 100%;
                margin-bottom: 40px;
            }
            
            .iam-login-title {
                font-weight: 700;
                font-size: 1.8rem;
                margin: 0 0 12px 0;
                color: #111827;
            }
            
            .iam-login-subtitle {
                font-weight: 700;
                font-size: 1rem;
                margin: 0 0 24px 0;
                color: #4b5563;
            }
            
            .iam-form-group {
                margin-bottom: 20px;
                text-align: left;
            }
            
            .iam-label {
                display: block;
                font-weight: 600;
                margin-bottom: 8px;
                color: #374151;
                font-size: 0.9rem;
            }
            
            .iam-input {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-family: 'Courier Prime', monospace;
                font-size: 1rem;
                box-sizing: border-box;
                transition: border-color 0.3s;
            }
            
            .iam-input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .iam-button {
                background-color: #1e3a8a;
                color: #ffffff;
                font-weight: 700;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Courier Prime', monospace;
                font-size: 1rem;
                width: 100%;
                transition: background-color 0.3s, transform 0.2s;
                margin-top: 8px;
            }
            
            .iam-button:hover {
                background-color: #3b82f6;
                transform: translateY(-2px);
            }
            
            .iam-button:active {
                transform: translateY(0);
            }
            

            .iam-social-section {
                margin: 32px 0 24px 0;
                padding: 24px 0 0 0;
                border-top: 1px solid #e5e7eb;
            }
            
            .iam-social-title {
                font-size: 0.9rem;
                color: #6b7280;
                margin: 0 0 16px 0;
                font-weight: 600;
            }
            
            .iam-social-buttons {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .iam-social-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                width: 100%;
                padding: 12px 0px;
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                color: #374151;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.3s;
                font-family: 'Courier Prime', monospace;
                font-size: 1rem;
            }
            
            .iam-social-btn:hover {
                background: #f9fafb;
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .iam-google-btn {
                border-color: #d1d5db;
            }
            
            .iam-google-btn:hover {
                border-color: #3b82f6;
            }
            
            .iam-social-icon {
                width: 18px;
                height: 18px;
                flex-shrink: 0;
            }

            
            .iam-footer {
                margin-top: 40px;
                font-size: 0.9rem;
                color: #9ca3af;
                text-align: center;
            }
            
            .iam-options {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 20px 0;
                font-size: 0.9rem;
            }
            
            .iam-remember {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .iam-links a {
                color: #3b82f6;
                text-decoration: none;
                font-weight: 600;
            }
            
            .iam-links a:hover {
                text-decoration: underline;
            }
            
            .iam-alert {
                padding: 12px 16px;
                border-radius: 8px;
                margin: 16px 0;
                font-size: 0.9rem;
            }
            
            .iam-alert-error {
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
            }
            
            .iam-alert-success {
                background-color: #f0fdf4;
                border: 1px solid #bbf7d0;
                color: #16a34a;
            }
            
            .iam-registration {
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                font-size: 0.9rem;
            }
            
            .iam-registration a {
                color: #3b82f6;
                text-decoration: none;
                font-weight: 600;
            }
            
            .iam-registration a:hover {
                text-decoration: underline;
            }
            
            @media (max-width: 480px) {
                .iam-login-card {
                    padding: 32px 20px;
                }
            }
        </style>
    <#elseif section = "form">
        <div class="iam-login-container">
            <div class="iam-login-card">
                <h1 class="iam-login-title">Iniciar sesión en 2CL</h1>
                <p class="iam-login-subtitle">Autenticación segura mediante Keycloak.</p>

                <#if realm.password>
                    <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                        <div class="iam-form-group">
                            <label for="username" class="iam-label">
                                <#if !realm.loginWithEmailAllowed>${msg("username")}
                                <#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}
                                <#else>${msg("email")}
                                </#if>
                            </label>
                            <input tabindex="1" id="username" class="iam-input" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off" />
                        </div>

                        <div class="iam-form-group">
                            <label for="password" class="iam-label">${msg("password")}</label>
                            <input tabindex="2" id="password" class="iam-input" name="password" type="password" autocomplete="off" />
                        </div>

                        <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                            <div class="iam-alert iam-alert-${message.type}">
                                ${kcSanitize(message.summary)?no_esc}
                            </div>
                        </#if>

                        <div class="iam-options">
                            <#if realm.rememberMe && !usernameEditDisabled??>
                                <div class="iam-remember">
                                    <input type="checkbox" id="rememberMe" name="rememberMe" <#if login.rememberMe??>checked</#if>>
                                    <label for="rememberMe">${msg("rememberMe")}</label>
                                </div>
                            </#if>
                            
                            <#if realm.resetPasswordAllowed>
                                <div class="iam-links">
                                    <a tabindex="5" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
                                </div>
                            </#if>
                        </div>

                        <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                        <button tabindex="4" class="iam-button" name="login" id="kc-login" type="submit">${msg("doLogIn")}</button>
                    </form>
                </#if>


                <#if social.providers??>
                    <div class="iam-social-section">
                        <p class="iam-social-title">O inicia sesión con</p>
                        <div class="iam-social-buttons">
                            <#list social.providers as p>
                                <a href="${p.loginUrl}" class="iam-social-btn iam-${p.alias}-btn">
                                    <svg class="iam-social-icon" viewBox="0 0 24 24">
                                        <#if p.alias == "google">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        <#else>
                                            <circle cx="12" cy="12" r="10" fill="#6b7280"/>
                                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="10">${p.alias?substring(0,1)?upper_case}</text>
                                        </#if>
                                    </svg>
                                    ${p.displayName}
                                </a>
                            </#list>
                        </div>
                    </div>
                </#if>

                <#if realm.registrationAllowed && !registrationDisabled??>
                    <div class="iam-registration">
                        <span>${msg("noAccount")} <a tabindex="6" href="${url.registrationUrl}">${msg("doRegister")}</a></span>
                    </div>
                </#if>
            </div>

            <footer class="iam-footer">
                © 2025 Ciberseguridad IAM - 2CL
            </footer>
        </div>
    </#if>
</@layout.registrationLayout>