<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:foo="foo.com" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:dc="http://purl.org/dc/terms/" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:sparql="http://www.w3.org/2005/sparql-results#" xmlns:my="http://test.org/" xmlns:map="http://www.w3.org/2005/xpath-functions/map" exclude-result-prefixes="#all" version="3.0">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes"/>

    <doc xmlns="http://www.oxygenxml.com/ns/doc/xsl">
        <desc>
            <h1>Widget tei-ref.</h1>
            <p>Contact person: daniel.stoxreiter@oeaw.ac.at</p>
            <p>Applied with apply-templates in html:body.</p>
            <p>The template "tei-ref" can handle the tei/xml tag ref.</p>
            <p>The template verifies if attributes like type and target are available.</p>
            <p>If a type attribute is found the template verifies if the value is either URI, URL, GND or VIAF.</p>
            <p>If a corresponding value is found the ref value will be used as URL and create a html link.</p>
            <p>If a target attribute is found the ref value will be used as URL and create a html link if the value starts with http or www.</p>
						<p>Adjusted by Barbara Krautgartner</p>
        </desc>
    </doc>
		<xsl:variable name="table-paths" as="map(*)">
			 <xsl:map>
			 		<xsl:map-entry key="'Tabelle_1.xml'" select="'primaerquellen'"/>
					<xsl:map-entry key="'Tabelle_2.xml'" select="'sekundaerquellen'"/>
          <xsl:map-entry key="'Tabelle_3.xml'" select="'ausserhalb_wiens'"/>
					<xsl:map-entry key="'Tabelle_4.xml'" select="'zu_bruckners_lebzeiten'"/>
					<xsl:map-entry key="'Tabelle_5.xml'" select="'nach_wab_nummer'"/>
      	</xsl:map>
		</xsl:variable>
    <xsl:template match="tei:ref">
        <xsl:choose>
            <xsl:when test="@type='URI' or @type='URL' or @type='GND' or @type='VIAF'">
                <a target="_blank">
                    <xsl:attribute name="href">
                        <xsl:value-of select="@target"/>
                    </xsl:attribute>
                    <xsl:apply-templates/>
                </a>
            </xsl:when>
            <xsl:when test="starts-with(@target,'http') or starts-with(@target,'www')">
                <xsl:choose>
                    <xsl:when test="parent::tei:cell[@role='WAB-Nummer']">
                        <a target="_blank">
                            <xsl:attribute name="href">
                                <xsl:value-of select="@target"/>
                            </xsl:attribute>
                            <!--<xsl:text>wab</xsl:text>--><xsl:apply-templates/>
                        </a>
                    </xsl:when>
                    <xsl:otherwise>
                        <a target="_blank">
                            <xsl:attribute name="href">
                                <xsl:value-of select="@target"/>
                            </xsl:attribute>
                            <xsl:apply-templates/>
                        </a>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:when>
            <xsl:when test="@target and not(@type) and not(@corresp)">
                <a title="Bild anzeigen / view image" href="{concat(
                    'https://bk-img.acdh-dev.oeaw.ac.at/',
                    @target)}">
                    <xsl:apply-templates/>
                </a>
            </xsl:when>
            <xsl:when test="@corresp">
                <xsl:variable name="cp" select="tokenize(@target, '/')"/>
								<xsl:variable name="refId" select="replace(./@corresp,'content-','')"/>
                <xsl:apply-templates/>
                <a>
                    <xsl:attribute name="href">
                        <xsl:value-of select="replace($cp[last()], '^.+$', $refId)"/>
                    </xsl:attribute>
                    <xsl:attribute name="title">
                        <xsl:value-of select="replace($cp[last()], '.xml', '')"/>
                    </xsl:attribute>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-in-right inline" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z"/>
                        <path fill-rule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                    </svg>
                </a>
                <xsl:if test="following-sibling::tei:ref and ancestor::tei:table">
                    <xsl:text> / </xsl:text>
                </xsl:if>
            </xsl:when>
            <xsl:when test="@type='noteAnchor'">
                <small>
                    <a id="{@xml:id}" style="vertical-align:super;">
                        <xsl:attribute name="href">
                            <xsl:value-of select="@target"/>
                        </xsl:attribute>
                        <xsl:apply-templates/>
                    </a>
                </small>
            </xsl:when>
            <xsl:when test="@type='table'">
                <xsl:variable name="tg" select="tokenize(@target, '/')"/>
                <a>
                    <xsl:attribute name="href">
                        <xsl:value-of select="replace($tg[last()], '^.+$', map:get($table-paths,$tg[last()]))"/>
                    </xsl:attribute>
                    <xsl:attribute name="title">
                        <xsl:value-of select="replace($tg[last()], '^.+$', map:get($table-paths,$tg[last()]))"/>
                    </xsl:attribute>
                    <xsl:apply-templates/>
                </a>
            </xsl:when>
            <xsl:otherwise>
                <xsl:apply-templates/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>
